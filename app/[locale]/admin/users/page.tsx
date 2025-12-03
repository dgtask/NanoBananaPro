/**
 * 🔥 老王的用户角色管理页面
 * 用途: 管理员用户管理界面，支持用户CRUD操作和权限提升
 * 老王警告: 这个页面要是操作失误，用户权限都要被搞乱！
 *
 * 更新: 添加了Tab切换，支持查看所有注册用户并提升为管理员
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Users,
  Shield,
  Crown,
  Eye,
  Key,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Github,
  Chrome
} from 'lucide-react'
import Image from 'next/image'

// 管理员用户接口
interface AdminUser {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'viewer'
  status: 'active' | 'inactive' | 'suspended'
  auth_provider: 'email' | 'google' | 'github'
  user_id?: string
  email_verified: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

// 全部用户接口（包括普通用户）
interface AllUser {
  id: string
  email: string
  name?: string
  avatar?: string
  auth_provider: 'email' | 'google' | 'github' | 'apple'
  email_verified: boolean
  created_at: string
  last_sign_in_at?: string
  // 管理员相关信息
  is_admin: boolean
  admin_role?: 'super_admin' | 'admin' | 'viewer'
  admin_status?: 'active' | 'inactive' | 'suspended'
}

// 角色配置
const roleConfig = {
  super_admin: {
    name: '超级管理员',
    icon: <Crown className="w-4 h-4" />,
    color: 'red',
    description: '拥有所有权限'
  },
  admin: {
    name: '管理员',
    icon: <Shield className="w-4 h-4" />,
    color: 'blue',
    description: '拥有大部分管理权限'
  },
  viewer: {
    name: '只读用户',
    icon: <Eye className="w-4 h-4" />,
    color: 'green',
    description: '只能查看数据'
  }
}

// 状态配置
const statusConfig = {
  active: {
    name: '正常',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'green'
  },
  inactive: {
    name: '未激活',
    icon: <XCircle className="w-4 h-4" />,
    color: 'gray'
  },
  suspended: {
    name: '已停用',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'red'
  }
}

// 认证提供商配置
const authProviderConfig: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  email: {
    name: '邮箱登录',
    icon: <Mail className="w-4 h-4" />,
    color: 'blue'
  },
  google: {
    name: 'Google登录',
    icon: <Chrome className="w-4 h-4 text-red-500" />,
    color: 'red'
  },
  github: {
    name: 'GitHub登录',
    icon: <Github className="w-4 h-4" />,
    color: 'gray'
  },
  apple: {
    name: 'Apple登录',
    icon: <div className="w-4 h-4 bg-black rounded-sm" />,
    color: 'black'
  }
}

export default async function UserManagement({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // Tab状态
  const [activeTab, setActiveTab] = useState('admins')

  // 管理员列表相关状态
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [filteredAdminUsers, setFilteredAdminUsers] = useState<AdminUser[]>([])
  const [adminLoading, setAdminLoading] = useState(true)
  const [adminError, setAdminError] = useState<string | null>(null)

  // 全部用户列表相关状态
  const [allUsers, setAllUsers] = useState<AllUser[]>([])
  const [filteredAllUsers, setFilteredAllUsers] = useState<AllUser[]>([])
  const [allUsersLoading, setAllUsersLoading] = useState(false)
  const [allUsersError, setAllUsersError] = useState<string | null>(null)

  // 搜索和过滤状态
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [adminOnlyFilter, setAdminOnlyFilter] = useState(false)

  // 表单相关状态
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [promotingUser, setPromotingUser] = useState<AllUser | null>(null)

  // 表单数据
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'viewer',
    status: 'active',
    password: ''
  })

  // 提升表单数据
  const [promoteFormData, setPromoteFormData] = useState({
    role: 'admin' as 'super_admin' | 'admin' | 'viewer'
  })

  /**
   * 🔥 获取管理员用户列表（admin_users表）
   */
  const fetchAdminUsers = useCallback(async () => {
    try {
      setAdminLoading(true)
      setAdminError(null)

      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/users?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '获取管理员列表失败')
      }

      setAdminUsers(result.data)
      setFilteredAdminUsers(result.data)
    } catch (err) {
      console.error('获取管理员列表失败:', err)
      setAdminError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setAdminLoading(false)
    }
  }, [roleFilter, statusFilter, searchTerm])

  /**
   * 🔥 获取所有用户列表（包括普通用户）
   */
  const fetchAllUsers = useCallback(async () => {
    try {
      setAllUsersLoading(true)
      setAllUsersError(null)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (adminOnlyFilter) params.append('adminOnly', 'true')

      const response = await fetch(`/api/admin/users/all?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '获取用户列表失败')
      }

      setAllUsers(result.data)
      setFilteredAllUsers(result.data)
    } catch (err) {
      console.error('获取用户列表失败:', err)
      setAllUsersError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setAllUsersLoading(false)
    }
  }, [searchTerm, adminOnlyFilter])

  /**
   * 🔥 提升用户为管理员
   */
  const handlePromoteUser = async () => {
    if (!promotingUser) return

    try {
      console.log(`📋 提升用户: ${promotingUser.email} -> 角色: ${promoteFormData.role}`)

      const response = await fetch('/api/admin/users/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: promotingUser.id,
          email: promotingUser.email,
          name: promotingUser.name || promotingUser.email,
          role: promoteFormData.role,
          promotedBy: 'admin' // TODO: 从当前登录用户获取
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '提升用户失败')
      }

      console.log(`✅ 用户提升成功: ${promotingUser.email}`)
      alert(`用户 ${promotingUser.email} 已成功提升为 ${roleConfig[promoteFormData.role].name}！`)

      // 刷新列表
      await fetchAllUsers()
      await fetchAdminUsers()

      // 关闭模态框
      setShowPromoteModal(false)
      setPromotingUser(null)
    } catch (err) {
      console.error('提升用户失败:', err)
      alert('提升用户失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  /**
   * 🔥 降级管理员为普通用户
   */
  const handleDemoteUser = async (user: AllUser) => {
    if (!confirm(`确定要将管理员 "${user.email}" 降级为普通用户吗？此操作将移除其所有管理权限。`)) {
      return
    }

    try {
      console.log(`📋 降级管理员: ${user.email}`)

      const response = await fetch(`/api/admin/users/promote?email=${encodeURIComponent(user.email)}&demotedBy=admin`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '降级用户失败')
      }

      console.log(`✅ 管理员降级成功: ${user.email}`)
      alert(`管理员 ${user.email} 已被降级为普通用户！`)

      // 刷新列表
      await fetchAllUsers()
      await fetchAdminUsers()
    } catch (err) {
      console.error('降级用户失败:', err)
      alert('降级用户失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  /**
   * 创建用户（原有功能保留）
   */
  const createUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          updated_by: 'admin'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '创建用户失败')
      }

      await fetchAdminUsers()
      setShowCreateModal(false)
      resetForm()
    } catch (err) {
      console.error('创建用户失败:', err)
      alert('创建用户失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  /**
   * 更新用户（原有功能保留）
   */
  const updateUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingUser.id,
          ...formData,
          updated_by: 'admin'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '更新用户失败')
      }

      await fetchAdminUsers()
      setEditingUser(null)
      resetForm()
    } catch (err) {
      console.error('更新用户失败:', err)
      alert('更新用户失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  /**
   * 删除用户（原有功能保留）
   */
  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`确定要删除用户 "${user.email}" 吗？`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success && result.error !== '功能暂未实现') {
        throw new Error(result.message || '删除用户失败')
      }

      if (result.error === '功能暂未实现') {
        alert('删除功能正在开发中，敬请期待！')
        return
      }

      await fetchAdminUsers()
    } catch (err) {
      console.error('删除用户失败:', err)
      alert('删除用户失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  /**
   * 重置密码（原有功能保留）
   */
  const handleResetPassword = async (user: AdminUser) => {
    if (!confirm(`确定要重置用户 "${user.email}" 的密码吗？`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          updated_by: 'admin'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '重置密码失败')
      }

      alert(`密码重置成功！新密码: ${result.data.new_password}`)
    } catch (err) {
      console.error('重置密码失败:', err)
      alert('重置密码失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  /**
   * 重置表单
   */
  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'viewer',
      status: 'active',
      password: ''
    })
  }

  /**
   * 编辑用户
   */
  const handleEdit = (user: AdminUser) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      password: ''
    })
  }

  /**
   * 打开提升用户模态框
   */
  const handleOpenPromoteModal = (user: AllUser) => {
    setPromotingUser(user)
    setPromoteFormData({ role: 'admin' })
    setShowPromoteModal(true)
  }

  /**
   * Tab切换时加载数据
   */
  useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdminUsers()
    } else if (activeTab === 'all') {
      fetchAllUsers()
    }
  }, [activeTab, fetchAdminUsers, fetchAllUsers])

  /**
   * 过滤管理员用户
   */
  useEffect(() => {
    let filtered = adminUsers

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    setFilteredAdminUsers(filtered)
  }, [adminUsers, searchTerm, roleFilter, statusFilter])

  /**
   * 过滤全部用户
   */
  useEffect(() => {
    let filtered = allUsers

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (adminOnlyFilter) {
      filtered = filtered.filter(user => user.is_admin)
    }

    setFilteredAllUsers(filtered)
  }, [allUsers, searchTerm, adminOnlyFilter])

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-500">管理员用户账户和权限管理</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'admins' && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>新建管理员</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={activeTab === 'admins' ? fetchAdminUsers : fetchAllUsers}
            disabled={activeTab === 'admins' ? adminLoading : allUsersLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${(activeTab === 'admins' ? adminLoading : allUsersLoading) ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </Button>
        </div>
      </div>

      {/* Tab切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="admins" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>管理员账号</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>全部用户</span>
          </TabsTrigger>
        </TabsList>

        {/* 管理员账号 Tab */}
        <TabsContent value="admins" className="space-y-6">
          {/* 搜索和过滤 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="搜索管理员..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-40">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部角色</SelectItem>
                      <SelectItem value="super_admin">超级管理员</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="viewer">只读用户</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-40">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="active">正常</SelectItem>
                      <SelectItem value="inactive">未激活</SelectItem>
                      <SelectItem value="suspended">已停用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 错误提示 */}
          {adminError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-700">{adminError}</p>
              </CardContent>
            </Card>
          )}

          {/* 管理员列表 */}
          <Card>
            <CardHeader>
              <CardTitle>管理员列表</CardTitle>
              <CardDescription>
                共 {filteredAdminUsers.length} 个管理员用户
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adminLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="loading-spinner"></div>
                  <span className="ml-3 text-gray-500">加载中...</span>
                </div>
              ) : filteredAdminUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无管理员</h3>
                  <p className="text-gray-500">开始创建您的第一个管理员用户</p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                  >
                    创建管理员
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          用户信息
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          角色
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          认证方式
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          最后登录
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAdminUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                                {authProviderConfig[user.auth_provider]?.icon || <Users className="w-5 h-5 text-gray-400" />}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  {user.email}
                                  {user.email_verified && (
                                    <CheckCircle className="inline w-3 h-3 text-green-500 ml-1" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="secondary" className={`bg-${roleConfig[user.role].color}-100 text-${roleConfig[user.role].color}-800`}>
                              <div className="flex items-center space-x-1">
                                {roleConfig[user.role].icon}
                                <span>{roleConfig[user.role].name}</span>
                              </div>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="secondary" className={`bg-${statusConfig[user.status].color}-100 text-${statusConfig[user.status].color}-800`}>
                              <div className="flex items-center space-x-1">
                                {statusConfig[user.status].icon}
                                <span>{statusConfig[user.status].name}</span>
                              </div>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline">
                              <div className="flex items-center space-x-1">
                                {authProviderConfig[user.auth_provider]?.icon}
                                <span>{authProviderConfig[user.auth_provider]?.name}</span>
                              </div>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.last_login_at
                              ? new Date(user.last_login_at).toLocaleString('zh-CN')
                              : '从未登录'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(user)}
                                title="编辑"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {user.auth_provider === 'email' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResetPassword(user)}
                                  title="重置密码"
                                >
                                  <Key className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(user)}
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 全部用户 Tab */}
        <TabsContent value="all" className="space-y-6">
          {/* 搜索和过滤 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="搜索用户..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={adminOnlyFilter ? 'admin' : 'all'} onValueChange={(value) => setAdminOnlyFilter(value === 'admin')}>
                    <SelectTrigger>
                      <SelectValue placeholder="用户类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部用户</SelectItem>
                      <SelectItem value="admin">仅管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 错误提示 */}
          {allUsersError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-700">{allUsersError}</p>
              </CardContent>
            </Card>
          )}

          {/* 全部用户列表 */}
          <Card>
            <CardHeader>
              <CardTitle>全部用户列表</CardTitle>
              <CardDescription>
                共 {filteredAllUsers.length} 个用户（{filteredAllUsers.filter(u => u.is_admin).length} 个管理员，{filteredAllUsers.filter(u => !u.is_admin).length} 个普通用户）
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allUsersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="loading-spinner"></div>
                  <span className="ml-3 text-gray-500">加载中...</span>
                </div>
              ) : filteredAllUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无用户</h3>
                  <p className="text-gray-500">系统中还没有注册用户</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          用户信息
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          类型
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          认证方式
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          注册时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          最后登录
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAllUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full overflow-hidden relative">
                                {user.avatar ? (
                                  <Image src={user.avatar} alt={user.name || user.email} fill className="object-cover" sizes="40px" />
                                ) : (
                                  <Users className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name || user.email.split('@')[0]}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  {user.email}
                                  {user.email_verified && (
                                    <CheckCircle className="inline w-3 h-3 text-green-500 ml-1" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.is_admin && user.admin_role ? (
                              <Badge variant="secondary" className={`bg-${roleConfig[user.admin_role].color}-100 text-${roleConfig[user.admin_role].color}-800`}>
                                <div className="flex items-center space-x-1">
                                  {roleConfig[user.admin_role].icon}
                                  <span>{roleConfig[user.admin_role].name}</span>
                                </div>
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <div className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span>普通用户</span>
                                </div>
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline">
                              <div className="flex items-center space-x-1">
                                {authProviderConfig[user.auth_provider]?.icon}
                                <span>{authProviderConfig[user.auth_provider]?.name || user.auth_provider}</span>
                              </div>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString('zh-CN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.last_sign_in_at
                              ? new Date(user.last_sign_in_at).toLocaleDateString('zh-CN')
                              : '从未登录'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {user.is_admin ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDemoteUser(user)}
                                  className="text-orange-600 hover:text-orange-700"
                                  title="降级为普通用户"
                                >
                                  <UserMinus className="w-4 h-4 mr-1" />
                                  <span>降级</span>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenPromoteModal(user)}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="提升为管理员"
                                >
                                  <UserPlus className="w-4 h-4 mr-1" />
                                  <span>提升</span>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 创建/编辑管理员模态框 */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {editingUser ? '编辑管理员' : '创建新管理员'}
              </CardTitle>
              <CardDescription>
                {editingUser ? '修改管理员信息和权限' : '添加新的管理员用户'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    disabled={!!editingUser}
                  />
                </div>
                <div>
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="用户姓名"
                  />
                </div>
                <div>
                  <Label htmlFor="role">角色</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">超级管理员</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="viewer">只读用户</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {roleConfig[formData.role as keyof typeof roleConfig].description}
                  </p>
                </div>
                <div>
                  <Label htmlFor="status">状态</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">正常</SelectItem>
                      <SelectItem value="inactive">未激活</SelectItem>
                      <SelectItem value="suspended">已停用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!editingUser && (
                  <div>
                    <Label htmlFor="password">密码</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="输入密码（留空将自动生成）"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      留空将自动生成随机密码
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <div className="flex justify-end space-x-3 p-6 pt-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingUser(null)
                  resetForm()
                }}
              >
                取消
              </Button>
              <Button
                onClick={editingUser ? updateUser : createUser}
              >
                {editingUser ? '更新' : '创建'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 提升用户为管理员模态框 */}
      {showPromoteModal && promotingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>提升用户为管理员</CardTitle>
              <CardDescription>
                将用户 {promotingUser.email} 提升为管理员，并选择角色
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>用户信息</Label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-200 rounded-full">
                        {promotingUser.avatar ? (
                          <div className="relative h-10 w-10 rounded-full overflow-hidden">
                            <Image src={promotingUser.avatar} alt={promotingUser.name || promotingUser.email} fill className="object-cover" sizes="40px" />
                          </div>
                        ) : (
                          <Users className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {promotingUser.name || promotingUser.email.split('@')[0]}
                        </div>
                        <div className="text-sm text-gray-500">
                          {promotingUser.email}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="promote-role">选择管理员角色</Label>
                  <Select
                    value={promoteFormData.role}
                    onValueChange={(value: 'super_admin' | 'admin' | 'viewer') => setPromoteFormData({ role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">
                        <div className="flex items-center space-x-2">
                          <Crown className="w-4 h-4 text-red-500" />
                          <span>超级管理员</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span>管理员</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-green-500" />
                          <span>只读用户</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {roleConfig[promoteFormData.role].description}
                  </p>
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end space-x-3 p-6 pt-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPromoteModal(false)
                  setPromotingUser(null)
                }}
              >
                取消
              </Button>
              <Button
                onClick={handlePromoteUser}
                className="bg-blue-600 hover:bg-blue-700"
              >
                确认提升
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
