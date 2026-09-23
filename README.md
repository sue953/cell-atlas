# cell-atlas
细胞之间：面向高中生物课堂的三维细胞交互页面

本仓库及网页按用户最新要求公开，用于课堂教学与科普展示。

网站地址：https://sue953.github.io/cell-atlas/

## 运行

Mac 双击 `启动.command`，或运行 `python3 launch.py`。也可运行 `python3 -m http.server 5173 --directory dist` 后打开 http://localhost:5173/ 。

网页源码和模型均在 `dist/`，不需要编译。GitHub Pages 使用 `gh-pages` 分支的根目录，该分支由 `dist/` 生成；不要将整个主分支作为网站根目录。

## 当前功能

- 动物与植物细胞对照、分别旋转、细胞器拆分与详情。
- 植物与动物特有细胞器标注，标注随模型旋转。
- 独立 3D 结构与教学补全视图。

使用范围、来源和教学限制见 [CLASSROOM.md](CLASSROOM.md) 与 [拆分与教学核对.md](拆分与教学核对.md)。模型仅用于课堂教学与科普展示，不将仓库的可访问性解释为通用商业授权。

本次仅保存当前网页快照和必要说明，不包含本地 Git 历史、聊天记录、API 凭据、临时文件或原始大模型。
