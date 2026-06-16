# 🐾 Animal Crush - Pure Match-3

Một tựa game Match-3 tính điểm thuần túy và dễ thương lấy chủ đề động vật, được xây dựng trên nền tảng **PixiJS v8**, **GSAP** và **Vite**. Trò chơi tập trung vào trải nghiệm ghép ngọc mượt mà, trực quan, giao diện Glassmorphism hiện đại cùng các hiệu ứng hoạt ảnh cao cấp.

**Công nghệ sử dụng: PixiJS v8, JavaScript, GSAP, HTML5, CSS3, Vite.**

---

## 🎮 Các Tính Năng Nổi Bật

### 1. Cơ Chế Match-3 Thuần Điểm & Mượt Mà
* **Lưới Ngọc 8x8**: Kích thước tiêu chuẩn tối ưu hóa trải nghiệm chơi, cân bằng hoàn hảo giữa thử thách và tính giải trí.
* **Ngẫu Nhiên Ván Đấu**: 
  * Mỗi lượt chơi sẽ tự động lựa chọn **6 con vật ngẫu nhiên** trong số 44 nhân vật động vật siêu dễ thương để làm ngọc trên bảng.
  * Tự động chọn ngẫu nhiên 1 trong 3 hình nền phong cảnh Việt Nam mỗi khi khởi chạy.
* **Tự Động Tráo Bài Khi Bế Tắc (Optimized Deadlock Shuffle)**: 
  * Hệ thống tự động kiểm tra nước đi ghép 3 khả thi.
  * Nếu không còn nước đi, game sẽ tự động thực hiện tráo đổi tham chiếu tối ưu trong bộ nhớ (không hủy/tạo lại Sprite gây lag giật) và trượt các viên ngọc về vị trí mới bằng hoạt ảnh mượt mà của GSAP.

### 2. Giao Diện Glassmorphic & Hiệu Ứng VFX Premium
* **Bảng Thành Tích (Leaderboard)**: Lưu trữ và hiển thị Top 5 điểm số cao nhất kèm ngày giờ chơi trong `localStorage`. Hiển thị bảng chúc mừng kỷ lục khi kết thúc ván đấu.
* **Hoạt ảnh HUD phản hồi (Pulsing HUD)**: Điểm số (`SCORE`) và số lượt đi (`MOVES`) co giãn đàn hồi mỗi khi thay đổi chỉ số.
* **Điểm số bay lên (Floating Scores)**: Hiển thị lượng điểm cộng tại tâm vụ nổ ngọc (`+10`, `+25`, hoặc kèm nhân số combo `+50 (x2)`).
* **Viền chọn Cyan Neon**: Hiệu ứng nhấp nháy nhịp nhàng bằng GSAP trên viên ngọc đang chọn.
* **Hạt nổ đồng điệu màu**: Ngọc của con vật nào nổ sẽ tạo ra vụ nổ hạt sáng rực rỡ có màu sắc tương ứng.
* **Bụi sáng lơ lửng (Ambient Particles)**: Các hạt bụi sáng trôi nổi chậm rãi phía sau bảng ngọc làm nền game thêm phần huyền ảo.

### 3. Tích Hợp Cầu Nối Âm Thanh & Tương Tác
* Tích hợp **Wink Bridge SDK (v8.0)** ngay đầu trang để quản lý bật/tắt tiếng từ xa và gửi dữ liệu tương tác người chơi lên trang mẹ của iframe.

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Game

### 1. Yêu Cầu Hệ Thống
* Máy tính đã cài đặt **Node.js** (Khuyến nghị phiên bản v18 trở lên).

### 2. Các Bước Cài Đặt
Mã nguồn chính nằm trong thư mục `demo/`.

1. Di chuyển vào thư mục `demo`:
   ```bash
   cd demo
   ```

2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```

3. Khởi động môi trường phát triển (Local Development):
   ```bash
   npm run dev
   ```
   *Mặc định dự án sẽ chạy tại địa chỉ: `http://localhost:8081` (hoặc `http://localhost:8080`)*

4. Đóng gói sản phẩm (Production Build):
   ```bash
   npm run build
   ```
   *Sản phẩm đầu ra sẽ nằm trong thư mục `demo/dist/` sẵn sàng để triển khai lên Vercel, Netlify...*

---

## 📂 Sơ Đồ Cấu Trúc Mã Nguồn

```
demogame/
├── demo/
│   ├── public/
│   │   ├── assets/       # Tài nguyên hình ảnh, background, ngọc con vật
│   │   └── logo.png      # Logo chính thức của game (Mèo đá quý 3D)
│   ├── src/
│   │   ├── game/         # Lõi Match-3 (Board, Tile, Field, CombinationManager)
│   │   ├── scenes/       # Quản lý cảnh (MainMenuScene, GameScene)
│   │   ├── system/       # Hỗ trợ hệ thống (App, SaveManager, SceneManager)
│   │   ├── wink-bridge.js# SDK giao tiếp âm thanh & tương tác
│   │   └── main.js       # Điểm khởi động game chính
│   ├── index.html        # Entry point HTML
│   ├── style.css         # CSS reset và layout canvas
│   └── vite.config.js    # Cấu hình đóng gói Vite
└── README.md
```

---

## 🔗 Liên Kết Liên Quan
* **Mã nguồn trên Github**: [marth3](https://github.com/Thangwin2004/marth3)
* **Triển khai live demo**: Tự động đồng bộ qua Vercel.
