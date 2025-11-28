import { defineStore } from 'pinia'

import type { ApiResponse } from '@/types/api/response'
import type { Role, User } from '@/types/models/user'
import { $publicAPI, $rootAPI } from '@/utils/api'
import { showToast } from '@/utils/toaster'

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    isLogin: false as boolean,
    credentials: {
      token_type: '' as string,
      expires_in: '' as string,
      access_token: '' as string,
      refresh_token: '' as string,
    },
    abilities: [] as any[],
    adminAbilities: [] as any[],
    schoolModeAbilities: [] as any[],
    userData: {} as User,
    permissions: [] as string[],
    roles: [] as Role[],

    resetPasswordData: {
      email: '',
      createdAt: undefined as Date | undefined,
      countdown: 60,
      canResend: false,
    },
  }),

  getters: {
    getIsLogin: state => state.isLogin,
    getUser: state => state.userData,
    getPermissions: state => state.permissions,
  },

  actions: {
    async login(payload: any) {
      try {
        const res = await $publicAPI<ApiResponse<any>>('platform/auth/login', {
          method: 'POST',
          body: {
            email: payload.email,
            password: payload.password,
          },
        })

        const { tokenType, expiresIn, accessToken, refreshToken } = res.data
        const { permissions, roles, ...userProfile } = res.data.user

        await this.setCredentials({
          token_type: tokenType,
          expires_in: expiresIn,
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        await this.setUser(userProfile)
        await this.setIsLogin(true)
        this.roles = roles
        this.setAbilities(permissions)

        return res
      }
      catch (error: any) {
        showToast(
          error?.data?.message || 'Terjadi Kesalahan',
          'error',
        )
        throw error
      }
    },

    async refreshToken() {
      try {
        const res = await $rootAPI<ApiResponse<any>>('auth/refresh-token', {
          method: 'POST',
        })

        const { tokenType, expiresIn, accessToken, refreshToken } = res.data

        await this.setCredentials({
          token_type: tokenType,
          expires_in: expiresIn,
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        await this.setUser(res.data.user)
        this.setAbilities(res.data.permissions)

        return res
      }
      catch (error: any) {
        showToast(
          error?.data?.message || 'Terjadi Kesalahan',
          'error',
        )
        throw error
      }
    },

    async register(payload: any) {
      try {
        const res = await $publicAPI<ApiResponse<any>>('auth/register', {
          method: 'POST',
          body: {
            name: payload.name,
            email: payload.email,
            password: payload.password,
            password_confirmation: payload.passwordConfirmation,
          },
        })

        const { tokenType, expiresIn, accessToken, refreshToken } = res.data

        await this.setCredentials({
          token_type: tokenType,
          expires_in: expiresIn,
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        await this.setUser(res.data.user)
        this.setAbilities(res.data.permissions)

        return res
      }
      catch (error: any) {
        showToast(
          error?.data?.message || 'Terjadi Kesalahan',
          'error',
        )
        throw error
      }
    },

    async resendCode(email: string) {
      try {
        const res = await $publicAPI<ApiResponse<any>>('auth/request-new-verify-email', {
          method: 'POST',
          body: { email },
        })

        showToast(
          res.data.message || 'Berhasil mengirimkan kode verifikasi',
          'success',
        )

        return res
      }
      catch (error: any) {
        showToast(
          error?.data?.message || 'Terjadi Kesalahan',
          'error',
        )
        throw error
      }
    },

    async verifyEmail(email: string, token: string) {
      try {
        return await $publicAPI<ApiResponse<any>>('auth/verify-email', {
          method: 'POST',
          body: { email, token },
        })
      }
      catch (error: any) {
        showToast(
          error?.data?.message || 'Terjadi Kesalahan',
          'error',
        )
        throw error
      }
    },

    async getMe() {
      return await $rootAPI<ApiResponse<User>>(
        `auth/me?module_id=${import.meta.env.VITE_APPS_MODULE_ID}`,
        {
          method: 'GET',
        },
      )
    },

    async setIsLogin(isLogin: boolean) {
      this.isLogin = isLogin
    },

    async setCredentials(credentials: any) {
      this.credentials = credentials
    },

    async setUser(user: User) {
      this.userData = user
    },

    async setAbilities(permissions: any[]) {
      const abilities: any = permissions?.map((permission: any) => ({
        action: 'manage',
        subject: permission,
      })) || []

      abilities.push({
        action: 'manage',
        subject: 'default',
      })

      this.abilities = abilities
    },

    unsetCredentials() {
      this.credentials = {
        token_type: '',
        expires_in: '',
        access_token: '',
        refresh_token: '',
      }
    },

    async unsetAbilities() {
      this.abilities = []
      this.adminAbilities = []
      this.schoolModeAbilities = []
    },

    async setBusinessUnitId(businessUnitId: string) {
      this.userData.businessUnitId = businessUnitId
    },

    async requestResetPassword(email: string) {
      const res = await $publicAPI<ApiResponse<any>>('auth/request-reset-password', {
        method: 'POST',
        body: { email },
      })

      this.resetPasswordData.canResend = false
      this.resetPasswordData.createdAt = new Date()
      this.resetPasswordData.countdown = 60
      this.startCountdown()

      return res
    },

    startCountdown() {
      this.resetPasswordData.canResend = false

      const interval = setInterval(() => {
        if (this.resetPasswordData.countdown > 0) {
          this.resetPasswordData.countdown--
        }
        else {
          this.resetPasswordData.countdown = 0
          this.resetPasswordData.canResend = true
          clearInterval(interval)
        }
      }, 1000)
    },

    async resetPassword(payload: any) {
      return await $publicAPI<ApiResponse<any>>('auth/reset-password', {
        method: 'POST',
        body: payload,
      })
    },

    async logout() {
      try {
        await $rootAPI('auth/logout', {
          method: 'POST',
        })
      }
      catch (error) {
        console.error('Logout error:', error)
      }

      this.isLogin = false
      this.userData = {} as User
      this.roles = []
      this.permissions = []
      this.unsetCredentials()
      await this.unsetAbilities()
    },
  },
  persist: true,
})
