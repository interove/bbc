# 憋憋杯第五届 · Supabase 配置指南

## 一、创建 Supabase 项目

1. 前往 [supabase.com](https://supabase.com) 注册账号
2. 点击 **New Project**，填写项目名称（如 `biebie-cup-5`）
3. 设置数据库密码，选择离你最近的区域
4. 等待项目创建完成

---

## 二、创建存储桶

1. 进入 Supabase Dashboard → **Storage**
2. 点击 **New bucket**
3. 名称填写：`submissions`
4. 取消勾选 **Public bucket**（保持私有）
5. 点击 **Save**

---

## 三、执行数据库 SQL

进入 **SQL Editor**，粘贴并执行以下 SQL：

```sql
-- 1. 用户资料表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 投稿记录表
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  song_name TEXT NOT NULL,
  composer TEXT NOT NULL,
  charter TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'IN',
  difficulty_level INTEGER NOT NULL DEFAULT 1,
  track_type TEXT NOT NULL DEFAULT 'regular' CHECK (track_type IN ('regular', 'entertainment')),
  mode TEXT NOT NULL DEFAULT 'solo' CHECK (mode IN ('solo', 'collab')),
  partner_username TEXT,
  partner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 启用行级安全
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 4. profiles 策略
CREATE POLICY "所有用户可查看profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "用户可创建自己的profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "用户可更新自己的profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. submissions 策略
CREATE POLICY "用户只能查看自己的投稿"
  ON public.submissions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建投稿"
  ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的投稿"
  ON public.submissions FOR DELETE USING (auth.uid() = user_id);
```

---

## 四、配置 Storage 策略

进入 **Storage → submissions bucket → Policies**，点击 **New Policy → For full customization**：

### 上传策略（INSERT）
- Policy name: `Allow authenticated uploads`
- Allowed operation: `INSERT`
- USING expression: `true`
- WITH CHECK expression:
  ```sql
  auth.uid()::text = (storage.foldername(name))[1]
  ```

### 读取策略（SELECT）
- Policy name: `Allow users to read own files`
- Allowed operation: `SELECT`
- USING expression:
  ```sql
  auth.uid()::text = (storage.foldername(name))[1]
  ```

### 删除策略（DELETE）
- Policy name: `Allow users to delete own files`
- Allowed operation: `DELETE`
- USING expression:
  ```sql
  auth.uid()::text = (storage.foldername(name))[1]
  ```

---

## 五、获取 API 密钥

进入 **Settings → API**，复制：
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` key → `VITE_SUPABASE_ANON_KEY`

---

## 六、本地开发

复制 `.env.example` 为 `.env`，填入上面的值：

```bash
cp .env.example .env
```

然后运行：
```bash
npm install
npm run dev
```

---

## 七、GitHub Pages 部署

1. 将代码推送到 GitHub repo
2. 进入 repo → **Settings → Secrets and variables → Actions**
3. 添加两个 Secret：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. 进入 **Settings → Pages → Source** 选择 **GitHub Actions**
5. 每次推送到 `main` 分支，GitHub Actions 自动构建并部署

---

## 八、Supabase Auth 配置（可选）

进入 **Authentication → Settings**：
- 如果不需要邮箱验证，关闭 **Enable email confirmations**
- 配置 **Site URL** 为你的 GitHub Pages URL：`https://你的用户名.github.io/仓库名`
- 在 **Redirect URLs** 中添加同样的 URL

---

## 管理员查看所有投稿

在 Supabase Dashboard → **Table Editor → submissions** 即可查看所有参赛者的投稿记录，并可手动修改 `status` 字段（`pending` / `accepted` / `rejected`）。
