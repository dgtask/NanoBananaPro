# GitHub Actions Cron Jobs 配置指南

> 🔥 老王实现：使用GitHub Actions替代Vercel免费计划的Cron Job限制

## 背景

Vercel免费计划仅支持**2个Cron Job**，但项目原本配置了5个。为了解决这个限制，我们采用以下方案：

### 方案1：合并Cron Job逻辑（已完成）

将 `refill-credits` 合并到 `activate-monthly-credits` 中：

- **保留在Vercel**：
  - `activate-monthly-credits`：每天凌晨0点（UTC）
  - `activate-pending-subscriptions`：每天凌晨1点（UTC）

### 方案2：使用GitHub Actions替代（已完成）

以下Cron Job改用GitHub Actions触发：

- `check-success-rate`：每天凌晨2点（UTC）
- `distribute-challenge-prizes`：每小时（整点）

---

## 📋 配置步骤

### 1. 配置GitHub Secrets

在GitHub仓库的 **Settings** → **Secrets and variables** → **Actions** 中添加以下secrets：

| Secret名称 | 值 | 说明 |
|-----------|---|------|
| `CRON_SECRET` | `your-secret-key-here` | Cron任务密钥（与生产环境 `.env` 中的 `CRON_SECRET` 相同） |
| `PRODUCTION_URL` | `https://your-app.vercel.app` | 生产环境URL（不要带尾部斜杠） |

**获取CRON_SECRET方法**：

```bash
# 方法1：从Vercel环境变量中获取
vercel env pull .env.production

# 方法2：生成新的密钥
openssl rand -base64 32
```

### 2. 验证Workflow文件

确认以下文件存在于 `.github/workflows/` 目录：

- `.github/workflows/cron-check-success-rate.yml` - 检查成功率（每天凌晨2点UTC）
- `.github/workflows/cron-distribute-prizes.yml` - 发放挑战奖励（每小时）

### 3. 推送到GitHub

```bash
git add .github/workflows/
git commit -m "feat: 添加GitHub Actions替代Vercel Cron Job"
git push origin main
```

### 4. 启用GitHub Actions

1. 进入GitHub仓库的 **Actions** 标签页
2. 如果Actions被禁用，点击 **I understand my workflows, go ahead and enable them**
3. 查看 **Workflows** 列表，确认两个workflow已启用：
   - "检查成功率 (每天凌晨2点UTC)"
   - "发放挑战奖励 (每小时整点)"

---

## 🧪 测试配置

### 手动触发测试

1. 进入GitHub仓库的 **Actions** 标签页
2. 选择要测试的workflow（如 "检查成功率"）
3. 点击右侧的 **Run workflow** 下拉菜单
4. 点击绿色的 **Run workflow** 按钮
5. 查看执行结果：
   - ✅ 绿色勾号 = 成功
   - ❌ 红色叉号 = 失败（检查日志排查）

### 本地测试API

```bash
# 测试检查成功率API
curl -X POST http://localhost:3000/api/cron/check-success-rate \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"

# 测试发放挑战奖励API
curl -X POST http://localhost:3000/api/cron/distribute-challenge-prizes \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## 📊 执行时间表

| Workflow | 执行时间（UTC） | 执行时间（北京） | 频率 |
|----------|---------------|----------------|------|
| activate-monthly-credits (Vercel) | 00:00 | 08:00 | 每天 |
| activate-pending-subscriptions (Vercel) | 01:00 | 09:00 | 每天 |
| check-success-rate (GitHub Actions) | 02:00 | 10:00 | 每天 |
| distribute-challenge-prizes (GitHub Actions) | 每小时 | 每小时 | 每小时 |

---

## 🔧 修改执行频率

如需修改GitHub Actions的执行频率，编辑对应的workflow文件：

```yaml
on:
  schedule:
    # 修改这一行的cron表达式
    - cron: '0 * * * *'
```

**Cron表达式格式**：`分 时 日 月 周`

**常用示例**：
- `0 * * * *` - 每小时（整点）
- `0 */6 * * *` - 每6小时
- `0 0 * * *` - 每天凌晨0点
- `0 0 * * 1` - 每周一凌晨0点
- `0 0 1 * *` - 每月1号凌晨0点

---

## 📌 注意事项

1. **GitHub Actions配额**：
   - 免费账号：每月2000分钟
   - 每小时执行的workflow会消耗较多配额
   - 如配额不足，考虑降低 `distribute-challenge-prizes` 的执行频率（如改为每6小时）

2. **时区**：
   - GitHub Actions使用UTC时间
   - 北京时间 = UTC + 8小时

3. **安全**：
   - 绝对不要在workflow文件中硬编码 `CRON_SECRET`
   - 使用GitHub Secrets保存敏感信息

4. **监控**：
   - 定期检查Actions标签页的执行日志
   - 失败时会在Actions页面显示红色叉号

---

## 🚨 故障排查

### 问题1：Workflow执行失败（401 Unauthorized）

**原因**：CRON_SECRET配置错误

**解决**：
1. 检查GitHub Secrets中的 `CRON_SECRET` 是否正确
2. 检查生产环境 `.env` 中的 `CRON_SECRET` 是否一致
3. 确认API端点的授权验证逻辑

### 问题2：Workflow没有自动执行

**原因**：GitHub Actions未启用或schedule触发器配置错误

**解决**：
1. 进入Actions标签页，确认workflow已启用
2. 检查 `.github/workflows/*.yml` 文件中的cron表达式
3. 确认main分支已推送到GitHub

### 问题3：API返回500错误

**原因**：API逻辑错误或数据库问题

**解决**：
1. 查看GitHub Actions执行日志中的响应内容
2. 查看Vercel生产环境的日志
3. 检查数据库连接和RPC函数

---

## 📚 相关文档

- [GitHub Actions文档](https://docs.github.com/en/actions)
- [Cron表达式参考](https://crontab.guru/)
- [Vercel Cron Jobs文档](https://vercel.com/docs/cron-jobs)

---

**老王签名**：艹！这个配置文档写得够详细了吧！按照这个步骤配置，GitHub Actions就能完美替代Vercel的Cron Job限制！🔥
