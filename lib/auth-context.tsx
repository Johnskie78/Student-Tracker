"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"

export type UserRole = "admin" | "user" | null
export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

export interface User {
  id: string
  username: string
  password: string // In a real app, this would be hashed
  role: UserRole
  name: string
  email: string
  adminId?: string // Make adminId optional for backward compatibility
  createdAt: string
}

interface AuthContextType {
  user: User | null
  status: AuthStatus
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  getAdminUsers: () => User[]
  addAdminUser: (user: Omit<User, "id" | "createdAt">) => Promise<User>
  updateAdminUser: (user: User) => Promise<User>
  deleteAdminUser: (id: string) => Promise<boolean>
  getCurrentUser: () => User | null
  findUserByAdminId: (adminId: string) => User | undefined
  resetPasswordByAdminId: (adminId: string, newPassword: string) => Promise<boolean>
  resetUsernameByAdminId: (adminId: string, newUsername: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Default admin user
const DEFAULT_ADMIN: User = {
  id: "1",
  username: "admin",
  password: process.env.DEFAULT_ADMIN_PASSWORD || "admin123" , //Password used for encryption
  role: "admin",
  name: "System Administrator",
  email: "admin@example.com",
  adminId: "ADMIN001", // Default admin ID
  createdAt: new Date().toISOString(),
}

// Local storage keys
const USERS_STORAGE_KEY = "auth_users"
const CURRENT_USER_KEY = "auth_current_user"

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")

  // Initialize admin users if none exist
  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY)
    if (storedUsers) {
      // Migrate existing users to include adminId if they don't have one
      try {
        const users = JSON.parse(storedUsers) as User[]
        let needsMigration = false

        const migratedUsers = users.map((user) => {
          if (!user.adminId) {
            needsMigration = true
            return {
              ...user,
              adminId: `ADMIN${user.id.substring(0, 3).toUpperCase()}`,
            }
          }
          return user
        })

        if (needsMigration) {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(migratedUsers))
        }
      } catch (error) {
        console.error("Error migrating users:", error)
      }
    } else {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([DEFAULT_ADMIN]))
    }
  }, [])

  useEffect(() => {
    // Check if user is already logged in
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_KEY)
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as User

          // Add adminId if missing
          if (!parsedUser.adminId) {
            parsedUser.adminId = `ADMIN${parsedUser.id.substring(0, 3).toUpperCase()}`
          }

          setUser(parsedUser)
          setStatus("authenticated")
        } catch (error) {
          console.error("Error parsing stored user:", error)
          localStorage.removeItem(CURRENT_USER_KEY) // Remove invalid data
          setStatus("unauthenticated")
        }
      } else {
        setStatus("unauthenticated")
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
      setStatus("unauthenticated")
    }
  }, [])

  const getAdminUsers = (): User[] => {
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY)
      return storedUsers ? JSON.parse(storedUsers) : [DEFAULT_ADMIN]
    } catch (error) {
      console.error("Error getting admin users:", error)
      return [DEFAULT_ADMIN]
    }
  }

  const addAdminUser = async (newUser: Omit<User, "id" | "createdAt">): Promise<User> => {
    try {
      const users = getAdminUsers()

      // Check if username already exists
      if (users.some((user) => user.username === newUser.username)) {
        throw new Error("Username already exists")
      }

      // Check if adminId already exists (if provided)
      if (newUser.adminId && users.some((user) => user.adminId === newUser.adminId)) {
        throw new Error("Admin ID already exists")
      }

      // Generate a unique adminId if not provided
      const adminId = newUser.adminId || `ADMIN${uuidv4().substring(0, 5).toUpperCase()}`

      const user: User = {
        ...newUser,
        adminId,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      }

      users.push(user)
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
      return user
    } catch (error) {
      console.error("Error adding admin user:", error)
      throw error
    }
  }

  const updateAdminUser = async (updatedUser: User): Promise<User> => {
    try {
      const users = getAdminUsers()

      // Check if username already exists for other users
      const existingUserWithSameUsername = users.find(
        (user) => user.username === updatedUser.username && user.id !== updatedUser.id,
      )

      if (existingUserWithSameUsername) {
        throw new Error("Username already exists")
      }

      // Check if adminId already exists for other users (if provided)
      if (updatedUser.adminId) {
        const existingUserWithSameAdminId = users.find(
          (user) => user.adminId === updatedUser.adminId && user.id !== updatedUser.id,
        )

        if (existingUserWithSameAdminId) {
          throw new Error("Admin ID already exists")
        }
      }

      // Ensure updatedUser has an adminId
      if (!updatedUser.adminId) {
        updatedUser.adminId = `ADMIN${updatedUser.id.substring(0, 3).toUpperCase()}`
      }

      const updatedUsers = users.map((user) => (user.id === updatedUser.id ? updatedUser : user))

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers))

      // Update current user if it's the same user
      if (user?.id === updatedUser.id) {
        setUser(updatedUser)
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser))
      }

      return updatedUser
    } catch (error) {
      console.error("Error updating admin user:", error)
      throw error
    }
  }

  const deleteAdminUser = async (id: string): Promise<boolean> => {
    try {
      // Don't allow deleting the current user
      if (user?.id === id) {
        throw new Error("Cannot delete the currently logged in user")
      }

      const users = getAdminUsers()

      // Don't allow deleting the last admin
      if (users.length <= 1) {
        throw new Error("Cannot delete the last admin user")
      }

      const updatedUsers = users.filter((user) => user.id !== id)
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers))

      return true
    } catch (error) {
      console.error("Error deleting admin user:", error)
      throw error
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const users = getAdminUsers()
      const matchedUser = users.find((u) => u.username === username && u.password === password)

      if (matchedUser) {
        // Ensure user has adminId
        if (!matchedUser.adminId) {
          matchedUser.adminId = `ADMIN${matchedUser.id.substring(0, 3).toUpperCase()}`

          // Update the user in storage
          const updatedUsers = users.map((u) => (u.id === matchedUser.id ? matchedUser : u))
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers))
        }

        setUser(matchedUser)
        setStatus("authenticated")
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(matchedUser))
        return true
      }

      return false
    } catch (error) {
      console.error("Error during login:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setStatus("unauthenticated")
    localStorage.removeItem(CURRENT_USER_KEY)
  }

  const getCurrentUser = (): User | null => {
    return user
  }

  const findUserByAdminId = (adminId: string): User | undefined => {
    const users = getAdminUsers()
    return users.find((user) => user.adminId === adminId)
  }

  const resetPasswordByAdminId = async (adminId: string, newPassword: string): Promise<boolean> => {
    try {
      const users = getAdminUsers()
      const userIndex = users.findIndex((user) => user.adminId === adminId)

      if (userIndex === -1) {
        throw new Error("User with this Admin ID not found")
      }

      users[userIndex].password = newPassword
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))

      return true
    } catch (error) {
      console.error("Error resetting password:", error)
      throw error
    }
  }

  const resetUsernameByAdminId = async (adminId: string, newUsername: string): Promise<boolean> => {
    try {
      const users = getAdminUsers()

      // Check if username already exists
      if (users.some((user) => user.username === newUsername)) {
        throw new Error("Username already exists")
      }

      const userIndex = users.findIndex((user) => user.adminId === adminId)

      if (userIndex === -1) {
        throw new Error("User with this Admin ID not found")
      }

      users[userIndex].username = newUsername
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))

      return true
    } catch (error) {
      console.error("Error resetting username:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        logout,
        getAdminUsers,
        addAdminUser,
        updateAdminUser,
        deleteAdminUser,
        getCurrentUser,
        findUserByAdminId,
        resetPasswordByAdminId,
        resetUsernameByAdminId,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
