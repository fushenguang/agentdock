export type AuthUser = {
  id: string
  email: string
  createdAt: string
}

export type AuthResult = {
  user: AuthUser | null
  error: string | null
}

export type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: string }
