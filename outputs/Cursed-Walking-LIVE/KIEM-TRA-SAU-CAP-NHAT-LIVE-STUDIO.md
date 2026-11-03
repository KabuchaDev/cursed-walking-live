# Kiểm tra sau cập nhật LIVE Studio — 13/10/2026

Phiên bản đang chạy: TikTok LIVE Studio 1.37.4 (nhật ký trước cập nhật là 1.36.6).

## Đã xác nhận trong lần kiểm tra này

- Bật lại server Minecraft và bộ kết nối; TikFinity và Streamer.bot kết nối thành công.
- Người chơi Dogalive67 vào được sân thủ thành.
- Lệnh kiểm tra đi qua action Streamer.bot tới Minecraft và trả kết quả thành công.
- Thử một Weak Zombie qua chính Streamer.bot: xuất hiện thành công, sau đó bị hạ. Đây là lệnh thử nội bộ, không phải tim thật.
- Kiểm tra mô phỏng luật tim/quà, quà đã tắt, chống sự kiện trùng, phân bố zombie, T2/T3 và hàng chờ: đạt.
- Kiểm tra tích hợp trong môi trường tách biệt: 433 zombie + 2 lần tăng hạng súng được giao qua 47 lượt lệnh duy nhất; giữ hàng chờ sau khởi động lại, không phát khi tạm dừng/thua/người chơi ngoài sân.
- Server sau khi người chơi vào: 20 TPS, thời gian xử lý trung bình khoảng 5 ms/tick ở thời điểm đo, chưa phải thử tải LIVE đông người.
- Cấu hình lưu của LIVE Studio vẫn có nguồn game javaw.exe, âm thanh Minecraft và micro Voicemod đang bật. Nguồn âm thanh toàn máy đặt mức 0; Minecraft có nguồn âm thanh riêng.
- Mod chat đã nạp và tìm đúng tài khoản mizukiichan69. Trước khi LIVE bắt đầu, dịch vụ trả trạng thái tài khoản chưa LIVE.

## Phần đang chờ phiên LIVE

- Tim thật từ tài khoản người xem → TikFinity → Streamer.bot → zombie.
- Bình luận thật → Take Your Stream Chat → bảng chữ trong game.
- Hình game, tiếng game và micro ở phía tài khoản xem.
- Quà thật chưa gửi thử; không cần chi xu cho kiểm tra nội bộ.

## Hiệu suất và giới hạn kiểm tra

Máy có khoảng 15,6 GB RAM sử dụng được, còn khoảng 0,7 GB trống ở hai lần đo khi game mở. GPU RTX 3050 Laptop: khoảng 41% sử dụng, 2.151/4.096 MiB VRAM ở một lần đo trước LIVE. Chưa kết luận độ mượt khi phát trực tiếp từ các số đo này.

Công cụ chụp cửa sổ LIVE Studio bị lỗi hết thời gian chờ hai lần; chưa xác minh hình/âm thanh phát thực tế bằng công cụ. Không thay đổi bố cục hay chất lượng phát đang lưu (1080p, 60 FPS, bitrate video 7.600).

Bằng chứng sự kiện mới ghi tại `live-studio-update-20261013.json`. Các con số tim/quà/follow tổng trong trạng thái bộ kết nối gồm lịch sử cũ; không được coi là sự kiện thật của lần kiểm tra này.
