/**
 * 🔥 老王的审计日志管理页面
 * 用途: 查看系统操作审计日志，追踪所有管理员操作
 * 老王警告: 这个页面要是不准确，出了问题根本查不到凶手！
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
import {
  Search,
  RefreshCw,
  Download,
  Calendar,
  Clock,
  User,
  Settings,
  Shield,
  AlertCircle,
  CheckCircle,
  Info,
  Filter,
  X
} from 'lucide-react'

// 审计日志接口
interface AuditLog {
  id: string
  admin_id: string
  action: string
  resource_type: string
  resource_id?: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  created_at: string
  created_at_formatted: string
}

// 操作类型映射
const actionTypeMap: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  'config_read': { name: '查看配置', icon: <Info className="w-4 h-4" />, color: 'blue' },
  'config_write': { name: '修改配置', icon: <Settings className="w-4 h-4" />, color: 'yellow' },
  'config_delete': { name: '删除配置', icon: <X className="w-4 h-4" />, color: 'red' },
  'promotion_read': { name: '查看活动', icon: <Info className="w-4 h-4" />, color: 'blue' },
  'promotion_write': { name: '修改活动', icon: <Settings className="w-4 h-4" />, color: 'yellow' },
  'promotion_delete': { name: '删除活动', icon: <X className="w-4 h-4" />, color: 'red' },
  'promotion_activate': { name: '激活活动', icon: <CheckCircle className="w-4 h-4" />, color: 'green' },
  'user_read': { name: '查看用户', icon: <Info className="w-4 h-4" />, color: 'blue' },
  'user_write': { name: '修改用户', icon: <Settings className="w-4 h-4" />, color: 'yellow' },
  'user_delete': { name: '删除用户', icon: <X className="w-4 h-4" />, color: 'red' },
  'user_role_manage': { name: '管理角色', icon: <Shield className="w-4 h-4" />, color: 'purple' },
  'audit_read': { name: '查看日志', icon: <Info className="w-4 h-4" />, color: 'blue' },
  'audit_export': { name: '导出日志', icon: <Download className="w-4 h-4" />, color: 'green' },
  'system_backup': { name: '系统备份', icon: <Download className="w-4 h-4" />, color: 'purple' },
  'system_restore': { name: '系统恢复', icon: <Upload className="w-4 h-4" />, color: 'orange' },
  'system_maintenance': { name: '系统维护', icon: <Settings className="w-4 h-4" />, color: 'red' }
}

// 资源类型映射
const resourceTypeMap: Record<string, { name: string; color: string }> = {
  'config': { name: '系统配置', color: 'blue' },
  'promotion': { name: '活动规则', color: 'green' },
  'user': { name: '用户管理', color: 'purple' },
  'audit': { name: '审计日志', color: 'orange' },
  'system': { name: '系统管理', color: 'red' }
}

function Upload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}

export default async function AuditLogManagement({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [resourceFilter, setResourceFilter] = useState('all')
  const [adminFilter, setAdminFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [exporting, setExporting] = useState(false)

  // 获取审计日志列表
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '50')

      if (actionFilter !== 'all') params.append('action', actionFilter)
      if (resourceFilter !== 'all') params.append('resourceType', resourceFilter)
      if (adminFilter) params.append('adminId', adminFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/audit?${params}`, {
        credentials: 'include', // 确保发送 cookies
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '获取审计日志失败')
      }

      setLogs(result.data)
      if (result.pagination) {
        setTotalPages(result.pagination.totalPages)
      }
    } catch (err) {
      console.error('获取审计日志失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter, resourceFilter, adminFilter, startDate, endDate, searchTerm])

  // 导出审计日志
  const exportLogs = async () => {
    try {
      setExporting(true)

      const params = new URLSearchParams()
      params.append('export', 'true')

      if (actionFilter !== 'all') params.append('action', actionFilter)
      if (resourceFilter !== 'all') params.append('resourceType', resourceFilter)
      if (adminFilter) params.append('adminId', adminFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/audit?${params}`, {
        credentials: 'include', // 确保发送 cookies
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 下载 CSV 文件
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

    } catch (err) {
      console.error('导出审计日志失败:', err)
      alert('导出失败: ' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setExporting(false)
    }
  }

  // 重置筛选
  const resetFilters = () => {
    setActionFilter('all')
    setResourceFilter('all')
    setAdminFilter('')
    setStartDate('')
    setEndDate('')
    setSearchTerm('')
    setPage(1)
  }

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">审计日志</h1>
          <p className="text-gray-500">查看和导出系统操作记录</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? '隐藏筛选' : '显示筛选'}</span>
          </Button>
          <Button
            variant="outline"
            onClick={exportLogs}
            disabled={exporting}
            className="flex items-center space-x-2"
          >
            <Download className={`w-4 h-4 ${exporting ? 'animate-spin' : ''}`} />
            <span>{exporting ? '导出中...' : '导出CSV'}</span>
          </Button>
          <Button
            variant="outline"
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </Button>
        </div>
      </div>

      {/* 筛选区域 */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="action-filter">操作类型</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部操作" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部操作</SelectItem>
                    <SelectItem value="config_read">查看配置</SelectItem>
                    <SelectItem value="config_write">修改配置</SelectItem>
                    <SelectItem value="config_delete">删除配置</SelectItem>
                    <SelectItem value="promotion_write">修改活动</SelectItem>
                    <SelectItem value="user_write">修改用户</SelectItem>
                    <SelectItem value="audit_export">导出日志</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="resource-filter">资源类型</Label>
                <Select value={resourceFilter} onValueChange={setResourceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部资源" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部资源</SelectItem>
                    <SelectItem value="config">系统配置</SelectItem>
                    <SelectItem value="promotion">活动规则</SelectItem>
                    <SelectItem value="user">用户管理</SelectItem>
                    <SelectItem value="audit">审计日志</SelectItem>
                    <SelectItem value="system">系统管理</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="admin-filter">管理员ID</Label>
                <Input
                  id="admin-filter"
                  placeholder="输入管理员ID"
                  value={adminFilter}
                  onChange={(e) => setAdminFilter(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="start-date">开始日期</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="end-date">结束日期</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full"
                >
                  重置筛选
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 搜索区域 */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜索日志（操作、资源、管理员ID...）"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setPage(1)
                  fetchLogs()
                }
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 审计日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle>审计日志列表</CardTitle>
          <CardDescription>
            共 {logs.length} 条记录 • 第 {page} / {totalPages} 页
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner"></div>
              <span className="ml-3 text-gray-500">加载中...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无审计日志</h3>
              <p className="text-gray-500">系统尚未记录任何操作日志</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        管理员
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        资源
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP地址
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            {log.created_at_formatted}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-900 font-medium">{log.admin_id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className={`bg-${actionTypeMap[log.action]?.color || 'gray'}-100 text-${actionTypeMap[log.action]?.color || 'gray'}-800`}
                          >
                            <div className="flex items-center space-x-1">
                              {actionTypeMap[log.action]?.icon}
                              <span>{actionTypeMap[log.action]?.name || log.action}</span>
                            </div>
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">
                            {resourceTypeMap[log.resource_type]?.name || log.resource_type}
                          </Badge>
                          {log.resource_id && (
                            <div className="text-xs text-gray-500 mt-1">
                              ID: {log.resource_id}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ip_address || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            查看详情
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  第 {page} 页，共 {totalPages} 页
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 详情模态框 */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>审计日志详情</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">日志ID</Label>
                    <p className="text-sm font-mono">{selectedLog.id}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">管理员ID</Label>
                    <p className="text-sm font-mono">{selectedLog.admin_id}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">操作类型</Label>
                    <p className="text-sm">{actionTypeMap[selectedLog.action]?.name || selectedLog.action}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">资源类型</Label>
                    <p className="text-sm">{resourceTypeMap[selectedLog.resource_type]?.name || selectedLog.resource_type}</p>
                  </div>
                  {selectedLog.resource_id && (
                    <div className="col-span-2">
                      <Label className="text-gray-500">资源ID</Label>
                      <p className="text-sm font-mono">{selectedLog.resource_id}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-gray-500">IP地址</Label>
                    <p className="text-sm">{selectedLog.ip_address || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">时间</Label>
                    <p className="text-sm">{selectedLog.created_at_formatted}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500">User Agent</Label>
                    <p className="text-sm break-all">{selectedLog.user_agent || '-'}</p>
                  </div>
                </div>

                {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                  <div>
                    <Label className="text-gray-500">旧值</Label>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                  <div>
                    <Label className="text-gray-500">新值</Label>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
