export function giteeTarget(
  options: { provider?: string; namespace?: string; visibility?: string },
  name: string,
) {
  if (!options.provider && !options.namespace && !options.visibility) return undefined
  if (options.provider !== 'gitee') throw new Error('Git delivery requires --provider gitee')
  const enterprise = /^enterprise:([a-zA-Z0-9][a-zA-Z0-9_-]*)$/.exec(options.namespace ?? '')?.[1]
  if (!enterprise) throw new Error('Gitee requires --namespace enterprise:<path>')
  const visibility = options.visibility ?? 'private'
  if (visibility !== 'private' && visibility !== 'internal') {
    throw new Error('Gitee visibility must be private or internal')
  }
  return { name, enterprise, visibility, url: `git@gitee.com:${enterprise}/${name}.git` }
}

interface GiteeRepo {
  id: number
  path?: string
  full_name?: string
  namespace?: { path?: string }
  enterprise?: { path?: string }
  description?: string
  private?: boolean
  internal?: boolean
  default_branch?: string
}

export async function deliverGiteeRepository(
  target: NonNullable<ReturnType<typeof giteeTarget>>,
  operationId: string,
  commit: string,
  knownId: number | undefined,
  run: (bin: string, args: string[], optional?: boolean) => string | undefined,
  record: (repoId: number) => void,
) {
  const token = process.env.GITEE_TOKEN?.trim()
  if (!token) throw new Error('GITEE_TOKEN is required for Gitee delivery')
  const { enterprise, name, url, visibility } = target
  const marker = `Created by AgentDock (${operationId})`
  const repoPath = `/repos/${enterprise}/${name}`

  async function request(path: string, form?: Record<string, string>) {
    const endpoint = new URL(`https://gitee.com/api/v5${path}`)
    if (!form) endpoint.searchParams.set('access_token', token!)
    const response = await fetch(endpoint, {
      method: form ? 'POST' : 'GET',
      body: form ? new URLSearchParams({ ...form, access_token: token! }) : null,
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    })
    if (response.status === 404 && !form) return undefined
    if (!response.ok)
      throw new Error(`Gitee ${form ? 'create' : 'lookup'} returned HTTP ${response.status}`)
    return (await response.json().catch(() => undefined)) as GiteeRepo | undefined
  }

  function assertRepository(repo: GiteeRepo | undefined) {
    const identityMatches =
      repo?.full_name === `${enterprise}/${name}` ||
      (repo?.path === name && (repo.namespace?.path ?? repo.enterprise?.path) === enterprise)
    const visibilityMatches =
      visibility === 'private'
        ? repo?.private === true
        : repo?.internal === true && repo.private === false
    if (
      !repo ||
      !Number.isSafeInteger(repo.id) ||
      !identityMatches ||
      !visibilityMatches ||
      (knownId === undefined ? repo.description !== marker : repo.id !== knownId)
    ) {
      throw new Error('Gitee repository identity, ownership or visibility could not be confirmed')
    }
    return repo
  }

  let repo = await request(repoPath)
  if (!repo && knownId === undefined) {
    try {
      await request(`/enterprises/${enterprise}/repos`, {
        name,
        path: name,
        description: marker,
        private: visibility === 'private' ? '0' : '2',
        auto_init: 'false',
        outsourced: 'false',
      })
    } catch (error) {
      repo = await request(repoPath)
      if (!repo) throw error
    }
    repo ??= await request(repoPath)
  }
  const initial = assertRepository(repo)
  record(initial.id)
  knownId = initial.id

  const origin = run('git', ['config', '--get', 'remote.origin.url'], true)
  if (origin && origin !== url) throw new Error('Local origin differs from the Gitee repository')
  if (!origin) run('git', ['remote', 'add', 'origin', url])
  const refs = run('git', ['ls-remote', '--refs', url])
  const published = `${commit}\trefs/heads/main`
  if (!refs) {
    try {
      run('git', ['push', url, `${commit}:refs/heads/main`])
    } catch (error) {
      if (
        !run('git', ['ls-remote', '--refs', url, 'refs/heads/main'])
          ?.split('\n')
          .includes(published)
      ) {
        throw error
      }
    }
  } else if (!refs.split('\n').includes(published)) {
    throw new Error('Gitee repository already contains different Git history')
  }
  if (run('git', ['ls-remote', '--refs', url, 'refs/heads/main']) !== published) {
    throw new Error('Could not verify the initial commit on Gitee')
  }
  const verified = assertRepository(await request(repoPath))
  if (verified.default_branch !== 'main') throw new Error('Gitee default branch is not main')
  return { id: verified.id, cloneUrl: url, visibility, defaultBranch: 'main' }
}
