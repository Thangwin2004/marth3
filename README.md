# Animal Crush (Match-3 Game)

Một tựa game Match-3 tính điểm thuần túy và dễ thương lấy chủ đề động vật, được xây dựng trên nền tảng **PixiJS v8** và **GSAP**. Trò chơi tập trung vào trải nghiệm ghép ngọc mượt mà, trực quan cùng giao diện Glassmorphism hiện đại.

## Tính Năng Nổi Bật
- **Cơ Chế Match-3 Mượt Mà:** Lưới ngọc 8x8. Ghép 3 viên giống nhau để ghi điểm.
- **Tự Động Tráo Bài (Shuffle):** Hệ thống tự động kiểm tra nước đi, nếu bế tắc sẽ tự động tráo đổi tham chiếu các viên ngọc trong bộ nhớ và trượt về vị trí mới bằng GSAP mà không giật lag.
- **Giao Diện Glassmorphic & VFX:** Sử dụng CSS Overlay đè lên Canvas 3D/2D để hiển thị UI cực kỳ sắc nét.
- **Ngẫu Nhiên Ván Đấu:** Mỗi lượt chơi tự động chọn 6 con vật ngẫu nhiên trong 44 nhân vật, và 1 trong 3 hình nền phong cảnh Việt Nam.
- **Animation GSAP:** Các hiệu ứng nổ (pop), rơi rớt (drop) và hoán đổi (swap) đều sử dụng hàm nội suy của GSAP mang lại trải nghiệm mượt mà.

## Kiến Trúc & Công Nghệ
- **Engine:** PixiJS v8 (Canvas/WebGL/WebGPU)
- **Animation:** GSAP 3
- **Kiến trúc MVC nâng cao:** 
  - `GameCore`: Quản lý logic bảng ngọc và thuật toán tìm Match-3.
  - `GameView`: Đảm nhiệm việc hiển thị và animation bằng PixiJS.
  - `InputController`: Xử lý tương tác vuốt/chạm của người dùng.
- **Tương tác UI:** Tách biệt UI HTML/CSS và Canvas PixiJS.

## Cài Đặt & Chạy Game
1. Mở terminal tại thư mục này (`marth3/demo`).
2. Cài đặt các gói phụ thuộc:
   ```bash
   pnpm install
   ```
3. Chạy server phát triển:
   ```bash
   pnpm run dev
   ```
4. Build bản production:
   ```bash
   pnpm run build
   ```
