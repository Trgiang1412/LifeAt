# LifeAt Spaces Clone - Next.js & Material UI

Dự án mô phỏng và tái tạo hoàn chỉnh hệ thống và giao diện phòng học tập / làm việc ảo **LifeAt.io Spaces** (tương tự như màn hình `https://lifeat.io/room/a7263e68-b5e5-4a63-8017-5defd71b31fc?space=M7KQ-ILKC&host=Trường's+Room`).

---

## 🚀 Các tính năng chính (Features)

### 1. 🖼️ Không gian hình nền sống động (Immersive Spaces & Video Loops)
- Hệ thống trình chiếu video nền HD loop mượt mà (Tokyo mưa đêm, Quán cà phê ấm cúng, Rừng thông nắng sớm, Bãi biển hoàng hôn, Lò sưởi mùa đông, Thư viện Oxford, Bầu trời Ghibli, Skyline thành phố).
- Hỗ trợ bộ chọn không gian (Spaces Modal) phân loại theo chủ đề: *Lofi, Cafe, Nature, City, Library, Fantasy*.
- Hiệu ứng gradient mờ (vignette overlay) giúp chữ và widget luôn hiển thị rõ nét trên mọi nền video.

### 2. ⏱️ Đồng hồ Pomodoro chuyên nghiệp
- Chế độ: **Pomodoro (25p)**, **Nghỉ ngắn (5p)**, **Nghỉ dài (15p)** (có thể tinh chỉnh trong cài đặt).
- Vòng đếm ngược trực quan, nút Bắt đầu / Tạm dừng / Reset / Chuyển hiệp.
- Đếm số chu kỳ Pomodoro đã hoàn thành.
- Phát âm thanh chuông ngân nga (tibetan chime) và hiệu ứng pháo hoa hoa giấy (`canvas-confetti`) khi hoàn thành hiệp tập trung.

### 3. 🎧 Bộ trộn âm thanh nền môi trường (Soundscape Mixer Engine)
- Tích hợp **Web Audio API Sound Engine** tự tổng hợp âm thanh thực tế ngay trên trình duyệt (không phụ thuộc vào link mp3 bên ngoài, không lo chết link hay lỗi CORS):
  - 🌧️ Tiếng mưa rơi (Rainfall)
  - 🔥 Lửa trại bập bùng (Campfire crackles)
  - 🌊 Tiếng sóng biển dạt dào (Ocean tide)
  - 🐦 Tiếng chim rừng hót líu lo (Forest birds)
  - ☕ Tiếng rì rầm quán cà phê (Cafe murmur)
  - ⌨️ Tiếng gõ bàn phím cơ (Mechanical key clicks)
  - 📻 Hợp âm Lofi ấm áp (Lofi chords)
  - 💨 Tiếng ồn trắng (White noise)
- Điều chỉnh âm lượng tổng thể (Master Volume) + thanh trượt âm lượng độc lập cho từng âm thanh.
- Bộ Preset nhanh: *Rainy Focus, Coffee Shop, Cabin Night, Nature Zen*.

### 4. 📋 Quản lý công việc (To-Do Tasks)
- Thêm nhanh nhiệm vụ bằng phím Enter.
- Checkbox đánh dấu hoàn thành, đếm số Pomodoro đã hoàn thành cho từng task.
- Bộ lọc: Tất cả / Đang làm / Đã xong.
- Tự động lưu trữ cục bộ (`localStorage`).

### 5. 📝 Ghi chú nhanh (Scratchpad Notes)
- Bảng nháp ý tưởng tức thì với bộ đếm số từ và số ký tự.
- Tự động lưu (`auto-save`).
- Nút copy toàn bộ nội dung vào clipboard chỉ với 1 cú click.

### 6. 🎵 Trình phát nhạc Lofi Radio
- Nhiều kênh thư giãn: *Chill Lo-Fi Beats, Synthwave Night Drive, Peaceful Piano Focus, Theta Waves*.
- Equalizer visualizer chuyển động theo giai điệu nhạc.

### 7. 👥 Phòng học chung & Trò chuyện trực tiếp (Room Members & Live Chat)
- Hiển thị Host ("Trường's Room"), mã phòng `M7KQ-ILKC`.
- Danh sách thành viên cùng học, trạng thái tập trung (Focusing / Break), trạng thái Mic/Cam.
- Tab tin nhắn trò chuyện trực tiếp và bảng reaction emoji nhanh (🔥, ☕, 👏, 💡, 🚀, 💯).
- Nút sao chép liên kết mời bạn bè vào phòng.

### 8. 📅 Lịch trình trong ngày (Daily Agenda)
- Hiển thị thứ ngày tháng hiện tại và các khối thời gian tập trung (Deep Work, Code Review, Nghỉ giải lao).

### 9. 👁️ Chế độ Zen Mode & Phím tắt (Keyboard Shortcuts)
- Nhấn phím `Z` hoặc nút Zen Mode: Ẩn toàn bộ widget và thanh công cụ để ngắm trọn vẹn cảnh nền và nghe âm thanh thư giãn.
- Nhấn phím `F` hoặc nút Fullscreen: Bật/tắt toàn màn hình.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
- **UI Library**: [Material UI (MUI v6)](https://mui.com/) (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`)
- **Sound Engine**: Web Audio API Synthesizer (tự tạo âm thanh thực không cần tệp ngoài)
- **Effects**: `canvas-confetti`
- **Design Style**: Modern Frosted Glassmorphism, Dark Mode, Rounded Pills

---

## 💻 Hướng dẫn chạy dự án (How to Run)

```bash
# Cài đặt dependencies (đã cài sẵn)
npm install

# Khởi chạy server phát triển
npm run dev
```

Mở trình duyệt và truy cập:
- Trang chủ hoặc phòng mặc định: [http://localhost:3000](http://localhost:3000)
- Hoặc URL phòng theo tham số như yêu cầu:
  [http://localhost:3000/room/a7263e68-b5e5-4a63-8017-5defd71b31fc?space=M7KQ-ILKC&host=Trường's+Room](http://localhost:3000/room/a7263e68-b5e5-4a63-8017-5defd71b31fc?space=M7KQ-ILKC&host=Trường's+Room)

