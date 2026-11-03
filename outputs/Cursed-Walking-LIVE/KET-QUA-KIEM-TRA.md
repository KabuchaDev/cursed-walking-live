# Kiểm tra Cursed Walking LIVE — 11/10/2026

**70 lượt kiểm tra trong game đã đạt. Tim và follow của TikTok LIVE thật cũng đã chạy thành công từ đầu đến cuối. Người chơi chọn dừng thử vì không có xu; chưa thử quà thật.**

Nguồn sự kiện của 70 lượt thử là mô phỏng theo định dạng TikFinity. Streamer.bot, action điều khiển, server Minecraft và nhân vật Dogalive đều là thật. Bộ đếm LIVE thật được giữ riêng, vẫn bắt đầu từ 0.

| Sự kiện | Kết quả đã kiểm đếm trong game |
|---|---|
| 99 tim rồi thêm 1 tim | 99 tim chưa sinh quái; tim thứ 100 sinh đúng 1 zombie |
| Follow | 5 zombie |
| Rose | 10 zombie |
| You're awesome | 1 súng T1, nạp sẵn, thêm đạn bằng 2 băng phù hợp |
| Finger Heart | 30 zombie |
| Okay | 4 món giáp sắt |
| Spinning Soccer | 1 Modern Axe |
| Rosa | 50 zombie |
| Shamrock | 1 Sledgehammer |
| Little kisses | 100 zombie |
| Perfume | 1 súng T2, nạp sẵn, thêm đạn bằng 3 băng phù hợp |
| Rose combo x2 | 20 zombie khi combo kết thúc; thông báo tiến độ và thông báo trùng không sinh thêm |

Đã kiểm đếm tổng cộng 216 zombie qua các lượt riêng, bao phủ cả 18 loại được cấu hình. Đã thử riêng toàn bộ 54 gói vật phẩm: 12 lựa chọn súng T1, 39 lựa chọn súng T2, giáp sắt, rìu và búa. Mã súng, loại đạn, lượng đạn dự phòng và đạn nạp sẵn đều khớp cấu hình.

## Những lỗi đã phát hiện và sửa

- Mutant Zombie cần kiểm tra vùng trống lớn; lệnh quá dài làm đường điều khiển ngắt. Đã chia bước kiểm tra thành các lệnh ngắn, sửa phần kết thúc lệnh và thử lại thành công.
- Lệnh phát đạn trên 100 viên bị TaCZ từ chối dù gói thưởng vẫn báo đã chạy. Đã chia lượng đạn thành nhiều lệnh, tối đa 64 viên mỗi lệnh; đã kiểm đếm lại toàn bộ súng.
- Giữ nguyên loại zombie đã chọn khi thiếu chỗ hoặc phải thử lại, tránh vô tình ưu tiên zombie nhỏ.
- Các chương trình cùng gửi lệnh có thể làm phản hồi server bị lẫn. Đã xếp lệnh tuần tự giữa các chương trình; 20 lệnh đồng thời đã trả đúng phản hồi sau sửa.

## Trạng thái sau thử

- Túi đồ và chế độ sinh tồn của Dogalive đã khôi phục.
- Zombie thử đã dọn sạch, chế độ bảo vệ khi thử đã tắt.
- TikFinity trên máy, Streamer.bot và server đã kết nối. Sau lượt thử LIVE, người chơi đã thoát server và phiên LIVE kết thúc.
- Bộ kết nối đang sẵn sàng nhận tim, follow và quà.

## Phần cần xác nhận bằng LIVE thật

TikFinity đã báo `isLive: true` và chuyển sự kiện tim/follow thật. Tại điểm kiểm tra, 245 tim nhận được tạo 2 zombie và dư 45 tim; một follow tạo thêm 5 zombie. Server xác nhận có đủ 7 zombie LIVE. Hàng chờ đã xử lý hết, không báo lỗi.

Người chơi chọn dừng tại đây vì không có xu để thử quà thật. Không có giao dịch quà nào được thực hiện trong lượt kiểm tra. Cả 9 luật quà đã đạt ở nguồn mô phỏng, nhưng đoạn TikTok gửi từng loại quà chưa được xác nhận bằng giao dịch thật.

Kết thúc lượt thử: đã nhận 651 tim, gọi 2 zombie từ tim và 5 từ follow. Khi người chơi thoát game, 4 zombie từ tim còn trong hàng chờ và còn dư 51 tim. Hàng chờ được giữ nguyên; 4 con này sẽ tiếp tục được gọi khi Dogalive vào lại và có chỗ trống. Không xóa các tim đã nhận.

Các lượt thử zombie theo kịch bản dùng quái đứng yên để kiểm đếm, chưa đo tải khi 100 con cùng chiến đấu hoặc xác nhận thao tác bắn/nạp đạn trên máy người chơi.

Bằng chứng chi tiết: `real-pipeline-verification.json`, `live-source-verification.json`, `logs/bridge.log`. Các lần thử trước khi sửa được giữ lại riêng để đối chiếu.
