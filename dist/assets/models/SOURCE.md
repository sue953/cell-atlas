# 教学模型来源

动物与植物细胞 GLB：[GordenSun / LearningCell](https://github.com/GordenSun/LearningCell)
固定版本：8666e6e66c7a6468f7b463099556902667582457

仓库 README 的“许可与说明”：
“本仓库的模型与图片源文件来自仓库作者本人提供的教学素材，仅用于课堂教学与科普展示。”

此处保留来源及课堂教学、科普展示用途限制，不将其描述为通用商业授权。

## 2026-09-21 全类别交互分区

两份原 GLB 文件未修改，仍为单一带纹理网格。页面依据对应的 parts.bin 分区记录创建独立索引，不重复原始三角面；0 号分区为未确定背景。

动物：15 个原表面部件，其中 8 个采用连通性提取，7 个采用区域切分。植物：16 个区域切分部件。每个部件的面数、边界、开放边和来源 SHA-256 记录于 parts.json。原始法线、UV 与纹理保留。

区域切分没有自动生成真实背面或封口，也不证明细胞器身份精确。原模型的小球仅可提供形态信息；溶酶体及囊泡身份为教学指定。核糖体无法可靠提取，另建两组教学示意，并明确标注。

“原模型拆分”展示原表面；“教学补全”使用独立教学几何，不能称为从原模型恢复的隐藏结构。

早期样品 animal-mitochondrion.glb、animal-mitochondrion-faces.bin 与 animal-mitochondrion-audit.json 保留，仍为 30,978 个原始面，未补面。新交互统一使用完整分区记录。

three.js 加载/导出器遵循 dist/vendor/THREE-LICENSE.txt；Draco 解码器遵循 dist/vendor/draco/LICENSE。
