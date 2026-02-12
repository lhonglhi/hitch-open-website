# 教授头像图片目录

## 📁 文件说明

此目录用于存放各参赛队伍的带队教授头像照片。

## 📸 图片要求

- **格式**: JPG/PNG
- **尺寸**: 建议 400x400 像素以上
- **比例**: 1:1 正方形
- **文件大小**: 建议小于 500KB

## 📝 命名规范

建议使用拼音命名，例如：
- `yu-liangyao.jpg` - 于良耀教授
- `placeholder.jpg` - 占位图（当教授信息待定时使用）

## 🔧 配置方法

在 `data/teams.json` 中配置教授头像路径：

```json
{
  "professor": {
    "name": {
      "zh": "于良耀",
      "en": "Yu Liangyao"
    },
    "avatar": "images/teams/professors/yu-liangyao.jpg",
    "bio": {
      "zh": "教授简介...",
      "en": "Professor bio..."
    }
  }
}
```

## 📋 当前需要的头像

### 清华大学
1. `yu-liangyao.jpg` - 于良耀教授

### 吉林大学（3位教授）
1. `song-dongjian.jpg` - 宋东鉴教授
2. `sun-bohua.jpg` - 孙博华教授
3. `zhang-sumin.jpg` - 张素民教授

### 其他学校
- `placeholder.jpg` - 占位图（待添加实际照片）

## 💡 提示

- 确保图片路径正确
- 使用相对路径（相对于 index.html）
- 图片不存在时会显示破损图标
