export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password) {
  return password && password.length >= 6
}

export function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

export function sanitizeInput(input) {
  if (typeof input !== "string") return ""
  return input.trim().replace(/[<>]/g, "")
}

export function validateRegistration(data) {
  const errors = {}

  if (!data.username || !validateUsername(data.username)) {
    errors.username = "Username must be 3-20 characters and contain only letters, numbers, and underscores"
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.email = "Please enter a valid email address"
  }

  if (!data.password || !validatePassword(data.password)) {
    errors.password = "Password must be at least 6 characters long"
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateLogin(data) {
  const errors = {}

  if (!data.email || !validateEmail(data.email)) {
    errors.email = "Please enter a valid email address"
  }

  if (!data.password) {
    errors.password = "Password is required"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
