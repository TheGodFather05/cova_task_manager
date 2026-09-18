/** The single error envelope every endpoint returns. `errors` is absent unless field-level. */
export interface ApiError {
  timestamp: string
  status: number
  message: string
  errors?: Record<string, string>
}
