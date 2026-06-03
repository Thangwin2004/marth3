# ⚔️ Match-3 Boss Battle RPG (Vinh Quang Anh Hùng)

Một tựa game Web-based nhập vai chiến đấu với Boss bằng cơ chế Match-3 cao cấp, được phát triển trên nền tảng **PixiJS v8**, **GSAP** và **Vite**. Trò chơi kết hợp giữa chiều sâu chiến thuật của dòng game nhập vai RPG (hệ thống khắc chế thuộc tính, trạng thái bất lợi, kỹ năng kích hoạt, nâng cấp nhân vật) với trải nghiệm giải đố Match-3 mượt mà và trực quan.

**Technologies: PixiJS, JavaScript, GSAP, HTML5, CSS3, Vite, Node.js.**

---

## 🎮 Các Tính Năng Nổi Bật

### 1. Cơ Chế Match-3 Cao Cấp & Mượt Mà
* **Khớp Ngọc Đặc Biệt**: 
  * Ghép 4 ngọc tạo thành **Rune Gem (Ngọc Cổ Tự)** kích nổ chữ thập tiêu hủy toàn hàng và cột.
  * Ghép 5 ngọc tạo thành **Rainbow Gem (Ngọc Cầu Vồng)** quét sạch toàn bộ ngọc có cùng màu sắc được ghép.
* **Tự Động Trộn (Auto-Shuffle)**: Khi bảng không còn nước đi hợp lệ, hệ thống tự động trộn ngọc kèm hiệu ứng rung lắc màn hình và thông báo.
* **Đa Dạng Kích Thước Bảng**: Hỗ trợ linh hoạt kích thước bảng **8x8, 10x10, 12x12** tương ứng độ khó các màn chơi, tự động co giãn tỷ lệ ngọc sắc nét.

### 2. Hệ Thống Chiến Đấu RPG Chiến Thuật
* **Đấu Lượt Kịch Tính**: Lượt đi được quyết định ngẫu nhiên bằng tung đồng xu 3D ở đầu trận.
* **Tương Khắc Thuộc Tính**: Ma trận khắc chế thuộc tính giữa 10 hệ ngọc (`Lửa`, `Nước`, `Thiên Nhiên`, `Băng`, `Lôi`, `Đất`, `Gió`, `Tâm Linh`, `Ánh Sáng`, `Độc`). Đánh vào hệ yếu của Boss gây x1.5 sát thương, đánh vào hệ kháng giảm còn x0.5.
* **Hiệu Ứng Trạng Thái (Debuffs)**: 
  * `Thiêu Đốt` (mất máu theo lượt).
  * `Trúng Độc` (mất máu mỗi khi thực hiện nước đi).
  * `Đóng Băng` (khóa ngọc không cho di chuyển).
  * `Tê Liệt` (mất lượt).
  * `Nguyền Rủa` (nhận thêm sát thương).
* **Bảng Chú Giải & Chỉ Báo (Tooltip)**: Di chuột trực quan để kiểm tra thông tin chi tiết các thuộc tính khắc chế và trạng thái bất lợi trên cả Hero và Boss.

### 3. Kỹ Năng Kích Hoạt & Trang Bị
* **9 Kỹ Năng Hero**: Quả cầu lửa, Hồi máu, Tráo bảng, Khiên hộ thể, Sét đánh, Thanh tẩy trạng thái bất lợi, Bom ngọc, Ngọc cầu vồng, và Thêm lượt đi.
* **Điện Anh Hùng (Hero Sanctuary)**: Khu vực nâng cấp chỉ số vĩnh viễn (Máu tối đa, Sát thương cơ bản), quản lý kỹ năng đã mở khóa, sắm sửa trang bị (Kiếm Ma Thuật, Giáp Vàng) bằng tiền vàng kiếm được từ các trận đấu.

### 4. Hiệu Ứng Đồ Họa & Âm Thanh Visuals Premium
* Phong cách thiết kế tối màu kết hợp **Glassmorphic** (thủy tinh mờ) bóng bẩy.
* Hiệu ứng hạt nổ (particle explosion) rực rỡ riêng biệt theo từng thuộc tính màu sắc ngọc.
* Cảnh báo thời tiết/môi trường (Environmental Events) dạng banner chuyển động điện ảnh chạy ngang màn hình.

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Game

### 1. Yêu Cầu Hệ Thống
* Máy tính đã cài đặt **Node.js** (Khuyến nghị phiên bản v18 trở lên).

### 2. Các Bước Cài Đặt
Dự án được cấu trúc dạng monorepo, phần mã nguồn chính nằm trong thư mục `demo/`.

1. Mở terminal và di chuyển vào thư mục `demo`:
   ```bash
   cd demo
   ```

2. Cài đặt các gói thư viện phụ thuộc:
   ```bash
   npm install
   ```

3. Khởi động môi trường phát triển (Local Development):
   ```bash
   npm run dev
   ```
   *Trình duyệt sẽ tự động mở trang game tại địa chỉ: `http://localhost:8080`*

4. Đóng gói sản phẩm (Production Build):
   ```bash
   npm run build
   ```
   *Sản phẩm đầu ra sẽ nằm trong thư mục `demo/dist/` sẵn sàng triển khai.*

---

## 📂 Sơ Đồ Cấu Trúc Mã Nguồn

```
demogame/
├── demo/
│   ├── public/
│   │   ├── assets/       # Tài nguyên hình ảnh, thẻ bài NPC, nền màn chơi
│   │   ├── logo.png      # Logo chính thức của game
│   │   └── style.css     # CSS reset và responsive canvas layout
│   ├── src/
│   │   ├── battle/       # Hệ thống chiến đấu (BattleScene, Damage, Skills, Status)
│   │   ├── data/         # Dữ liệu cấp độ (LevelData), dữ liệu kỹ năng (SkillData)
│   │   ├── game/         # Lõi Match-3 (Board, Tile, Field, CombinationManager)
│   │   ├── scenes/       # Quản lý cảnh (MainMenu, LevelSelect, HeroSanctuary)
│   │   ├── system/       # Hỗ trợ hệ thống (App wrapper, SaveManager, SceneManager)
│   │   ├── ui/           # Thành phần UI (BattleHUD, SkillBar, Tooltips, Popups)
│   │   └── main.js       # Khởi tạo luồng game
│   ├── index.html        # Entry point HTML
│   ├── vite.config.js    # Cấu hình đóng gói Vite
│   └── vercel.json       # Cấu hình deploy SPA
└── README.md
```

---

## 🔗 Liên Kết Liên Quan
* **Mã nguồn trên Github**: [demopixijsmatch3](https://github.com/Thangwin2004/demopixijsmatch3)
* **Triển khai live demo**: Tự động đồng bộ qua Vercel.
