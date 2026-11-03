# Cursed Walking LIVE — THÀNH TRÌ 07

**Mỗi 1 tim → 1 Weak Zombie tại cổng thủ thành.** Bản cập nhật hiện tại dùng 7 loại quà, súng luân phiên T1/T2/T3 và 6 trụ súng tự động.

## Bắt đầu chơi và LIVE

1. Mở **BAT-THU-THANH.cmd**, đợi server sẵn sàng.
2. Mở Cursed Walking v3.3 (patch), vào **127.0.0.1:25567**.
3. Gõ `/cw_td join` rồi `/cw_td start`, hoặc dùng nút tại căn cứ. `/cw_td` mở menu điều khiển.
4. Mở **BAT-KET-NOI-TIKTOK.cmd**, kết nối phòng LIVE trong TikFinity. Giữ TikFinity, Streamer.bot, server và bộ kết nối chạy.
5. Dùng **TRANG-THAI.cmd** xem kết nối và hàng chờ.

Cách chơi, các loại quà, súng và trụ: xem **THU-THANH.md**. Bảng nhanh: **BANG-TUONG-TAC.md**. Chat TikTok 3D: **CHAT-TRONG-MINECRAFT.md**.

## Cách nhận sự kiện

Tim tính theo số tim mới TikFinity gửi đến khi bộ kết nối chạy; không cộng lại tổng tim cũ. Ví dụ 250 tim mới tạo 250 yêu cầu gọi Weak Zombie. Tối đa 120 zombie cùng hoạt động; số còn lại được giữ trong hàng chờ, mỗi đợt tối đa 10 con. Zombie ra tại cổng theo đường tới nhà chính.

Follow, You're awesome, Finger Heart và Spinning Soccer đã tắt. Combo quà chỉ cộng tổng khi kết thúc, bỏ thông báo trùng. Quà tăng hạng súng được ưu tiên trước hàng zombie. Tạm dừng, thua hoặc không có người trong sân sẽ giữ các hiệu ứng chưa thực hiện để dùng khi chơi tiếp.

Luật nằm trong bộ kết nối. **Không cần tạo thêm luật trùng trong TikFinity.** Sự kiện đi từ TikFinity qua action **Cursed Walking - Dispatch** của Streamer.bot tới Minecraft.

## Các nút tiện ích

| Nút | Tác dụng |
|---|---|
| TRANG-THAI.cmd | Xem kết nối, số tim và hàng chờ |
| KIEM-TRA-STREAMERBOT.cmd | Kiểm tra đường truyền, không gọi quái |
| THU-QUA.cmd | Thử các hiệu ứng quà hiện tại khi ở sân đang chạy |
| TAM-DUNG-HOAC-TIEP-TUC.cmd | Tạm dừng hoặc tiếp tục lượt |
| VE-MAP-SINH-TON.cmd | Về sinh tồn, khôi phục túi đồ cũ |
| TAT-KET-NOI-TIKTOK.cmd | Dừng nhận sự kiện, giữ hàng chờ |
| TAT-SERVER.cmd | Lưu thế giới rồi tắt server và bộ kết nối |
| SAO-LUU.cmd | Sao lưu sau khi đã tắt server |

## Lưu ý vận hành

Nếu có nhiều người online, đặt targetPlayer trong mappings.json để chọn đúng người nhận súng. Khi mất kết nối ở thời điểm chưa xác nhận được hiệu ứng, hàng chờ giữ lại để tránh thực hiện trùng.

Lỗi Create cùng phiên bản nhưng thiếu dữ liệu đã được xử lý bằng cách giảm nạp mod song song ở phía game; đã xác nhận Dogalive67 vào lại được. Giữ maxThreads = 1 trong config/fml.toml của bản game hiện tại.

Đã xác nhận người chơi dùng E gắn súng và nhận khẩu mới; trụ có ghi nhận bắn trong lượt thật. Streamer.bot đã cấp T3 và T2 đang chờ thành công. Quà TikTok trả xu thật chưa được gửi thử. Kết quả cũ trong KET-QUA-KIEM-TRA.md là lịch sử của bộ luật trước.

