import { readFileSync } from 'node:fs'

const fields = JSON.parse(
  readFileSync(new URL('../schemas/package-spec.schema.json', import.meta.url), 'utf8'),
).properties

export function validateSpec(spec) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec))
    throw new Error('Expected a spec object')
  const errors = []
  for (const name of Object.keys(spec)) {
    if (!Object.hasOwn(fields, name)) errors.push(`Unknown spec field: ${name}`)
  }
  if (spec.residency !== undefined && spec.residency !== fields.residency.const)
    errors.push('residency must be external')
  if (
    spec.artifactChannel !== undefined &&
    !fields.artifactChannel.enum.includes(spec.artifactChannel)
  )
    errors.push('Invalid artifactChannel')
  if (
    typeof spec.id !== 'string' ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.id) ||
    spec.id.length > 64
  )
    errors.push('id must be kebab-case and at most 64 characters')
  if (['docs', 'web'].includes(spec.id)) errors.push(`Reserved package id: ${spec.id}`)
  if (spec.hasWeb !== undefined && typeof spec.hasWeb !== 'boolean')
    errors.push('hasWeb must be a boolean')
  if (
    spec.version !== undefined &&
    (typeof spec.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(spec.version))
  )
    errors.push('version must use major.minor.patch')
  for (const key of ['displayName', 'intent', 'owner']) {
    if (typeof spec[key] !== 'string' || spec[key].trim() === '') errors.push(`${key} is required`)
    else if (spec[key].trim().length > fields[key].maxLength) errors.push(`${key} is too long`)
  }
  if (typeof spec.intent === 'string' && spec.intent.trim() && spec.intent.trim().length < 20) {
    errors.push('intent must be at least 20 characters')
  }
  if (
    spec.displayNameLocalized !== undefined &&
    (!spec.displayNameLocalized ||
      Object.keys(spec.displayNameLocalized).length !== 2 ||
      ['zh', 'en'].some((key) => {
        const name = spec.displayNameLocalized[key]
        return typeof name !== 'string' || !name.trim() || name.trim().length > 80
      }))
  ) {
    errors.push(
      'displayNameLocalized must contain nonempty zh and en names of at most 80 characters',
    )
  }
  if (
    spec.description !== undefined &&
    (typeof spec.description !== 'string' ||
      !spec.description.trim() ||
      spec.description.trim().length > 500)
  ) {
    errors.push('description must contain 1 to 500 characters')
  }
  if (spec.lifecycle !== 'active') errors.push('created formal packages must use lifecycle active')
  if (spec.repositoryClass !== 'product')
    errors.push('created formal packages must use repositoryClass product')
  if (spec.hasWeb === false && !spec.noWebException) {
    errors.push('hasWeb=false requires noWebException')
  }
  if (spec.noWebException !== undefined) {
    const exception = spec.noWebException ?? {}
    if (Object.keys(exception).some((key) => !Object.hasOwn(fields.noWebException.properties, key)))
      errors.push('Invalid noWebException field')
    if (typeof exception.reason !== 'string' || exception.reason.trim().length < 20) {
      errors.push('noWebException.reason must be at least 20 characters')
    }
    if (typeof exception.approvedBy !== 'string' || exception.approvedBy.trim() === '') {
      errors.push('noWebException.approvedBy is required')
    }
  }
  if (errors.length > 0) throw new Error(errors.join('; '))
  return {
    id: spec.id,
    displayName: spec.displayName.trim(),
    displayNameLocalized: spec.displayNameLocalized && {
      zh: spec.displayNameLocalized.zh.trim(),
      en: spec.displayNameLocalized.en.trim(),
    },
    description: spec.description?.trim(),
    intent: spec.intent.trim(),
    owner: spec.owner.trim(),
    version: spec.version ?? '0.1.0',
    lifecycle: 'active',
    repositoryClass: 'product',
    residency: 'external',
    hasWeb: spec.hasWeb ?? true,
    artifactChannel: spec.artifactChannel ?? 'pending',
    noWebException: spec.hasWeb === false ? spec.noWebException : undefined,
  }
}
