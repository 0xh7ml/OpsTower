const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"

// Get token from localStorage - safe for SSR
export const getAuthToken = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("authToken")
}

// Set token in localStorage - safe for SSR
export const setAuthToken = (token) => {
  if (typeof window === "undefined") return
  localStorage.setItem("authToken", token)
}

// Remove token from localStorage - safe for SSR
export const removeAuthToken = () => {
  if (typeof window === "undefined") return
  localStorage.removeItem("authToken")
}

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const token = getAuthToken()

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)

    // Special case for 404 on task list - return empty array instead of error
    if (response.status === 404 && endpoint === "/task/") {
      return []
    }

    if (!response.ok) {
      if (response.status === 401) {
        removeAuthToken()
        window.location.href = "/"
        return
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    // Handle empty responses (like DELETE)
    if (response.status === 204) {
      return null
    }

    return response.json()
  }

  // Auth methods
  async login(username, password) {
    const response = await this.request("/auth/token/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
    return response
  }

  async signup(email, password, firstName, lastName) {
    const response = await this.request("/auth/signup/", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      }),
    })
    return response
  }

  // Task methods
  async getTasks() {
    try {
      return await this.request("/task/")
    } catch (error) {
      // If there's an error fetching tasks, return an empty array
      console.error("Error fetching tasks:", error)
      return []
    }
  }

  async getTask(id) {
    return await this.request(`/task/${id}/`)
  }

  async createTask(task) {
    return await this.request("/task/", {
      method: "POST",
      body: JSON.stringify(task),
    })
  }

  async updateTask(id, task) {
    return await this.request(`/task/${id}/`, {
      method: "PUT",
      body: JSON.stringify(task),
    })
  }

  async deleteTask(id) {
    return await this.request(`/task/${id}/`, {
      method: "DELETE",
    })
  }
}

export const apiClient = new ApiClient()
