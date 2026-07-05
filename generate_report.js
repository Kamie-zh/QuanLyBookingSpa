const fs = require('fs');

let htmlContent = fs.readFileSync('/Users/mac/Desktop/spa-booking/bao-cao-do-an.html', 'utf8');

const usecaseDiagram = `
<div class="center" style="margin: 20px 0;">
<pre class="mermaid">
flowchart TD
    Guest([Guest])
    User([Khách Hàng])
    Admin([Quản Trị Viên])
    System([Hệ Thống])

    Guest --> UC1[Xem Trang Chủ & Dịch Vụ]
    Guest --> UC2[Đăng Ký & Đăng Nhập]
    Guest --> UC3[Quên Mật Khẩu]

    User --> UC4[Tra Cứu Lịch Trống]
    User --> UC5[Đặt Lịch Dịch Vụ]
    User --> UC6[Xem Lịch Hẹn & Hóa Đơn]
    User --> UC7[Hủy Lịch]
    User --> UC8[Áp Dụng Voucher VIP]

    Admin --> UC9[Quản Lý Dịch Vụ]
    Admin --> UC10[Cập Nhật Trạng Thái Lịch Hẹn]
    Admin --> UC11[Thêm Dịch Vụ Vào Hóa Đơn]
    Admin --> UC12[Quản Lý Khách Hàng]
    Admin --> UC13[Quản Lý Banner & Khuyến Mãi]
    Admin --> UC14[Thống Kê Báo Cáo]

    System --> UC15[Tự Động Nâng Cấp VIP]
    System --> UC16[Auto-Confirm Lịch Hẹn]
    System --> UC17[Gửi Email Thông Báo]
    
    User -.-|> Guest
</pre>
</div>
`;

const classDiagram = `
<div class="center" style="margin: 20px 0;">
<pre class="mermaid">
classDiagram
    class User {
        +String name
        +String email
        +String password
        +String phone
        +String role
        +String memberType
        +comparePassword()
    }
    class Service {
        +String name
        +String serviceType
        +String description
        +Number duration
        +Number price
        +String imageUrl
        +Boolean isActive
    }
    class Booking {
        +ObjectId user
        +ObjectId[] services
        +Date bookingDate
        +String startTime
        +String endTime
        +Number totalDuration
        +Number totalPrice
        +String status
        +String note
    }
    class EstimatedBill {
        +ObjectId booking
        +ObjectId user
        +ObjectId[] services
        +Number totalDuration
        +Number totalAmount
        +String status
    }
    class Promotion {
        +String code
        +String title
        +String discountType
        +Number discountValue
        +Date startDate
        +Date endDate
        +String targetMember
    }
    
    User "1" -- "*" Booking : places >
    Booking "1" -- "*" Service : includes >
    Booking "1" -- "1" EstimatedBill : generates >
    EstimatedBill "1" -- "*" Service : details >
    User "1" -- "*" EstimatedBill : pays >
</pre>
</div>
`;

const seqAuth = `
<div class="center" style="margin: 20px 0;">
<pre class="mermaid">
sequenceDiagram
    actor U as User
    participant F as Frontend (React)
    participant A as API (/auth)
    participant DB as MongoDB

    U->>F: Nhập Email & Password
    F->>A: POST /api/auth/login
    A->>DB: findOne(email)
    DB-->>A: User Document
    A->>A: Bcrypt.compare(password)
    alt Hợp lệ
        A->>A: Tạo JWT Token
        A-->>F: Trả về Token & User Info
        F->>F: Lưu LocalStorage
        F-->>U: Chuyển hướng Dashboard/Home
    else Không hợp lệ
        A-->>F: Báo lỗi "Sai mật khẩu"
        F-->>U: Hiển thị lỗi
    end
</pre>
</div>
`;

const seqBooking = `
<div class="center" style="margin: 20px 0;">
<pre class="mermaid">
sequenceDiagram
    actor U as User
    participant F as Frontend
    participant A as Booking API
    participant DB as MongoDB
    participant E as Nodemailer

    U->>F: Chọn DV, Ngày, Giờ
    F->>A: POST /api/bookings
    A->>DB: Check lịch đã đặt (startTime, endTime)
    DB-->>A: Danh sách Booking trong ngày
    A->>A: Tính tổng thời gian + 30p Buffer
    alt Trùng Lịch
        A-->>F: Lỗi "Khung giờ không khả dụng"
        F-->>U: Hiển thị lỗi trùng lịch
    else Hợp lệ
        A->>DB: Insert Booking (Pending)
        A->>DB: Insert EstimatedBill
        DB-->>A: Success
        A->>E: Gửi Email xác nhận đặt lịch (Async)
        A-->>F: Booking ID & Success
        F-->>U: "Đặt lịch thành công"
    end
</pre>
</div>
`;

htmlContent = htmlContent.replace('<head>', '<head>\n<script type="module">\n  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";\n  mermaid.initialize({ startOnLoad: true, theme: "default" });\n</script>');

htmlContent = htmlContent.replace('<h3 class="center">[DÁN ẢNH USECASE TỔNG QUÁT VÀO VỊ TRÍ NÀY]</h3>', usecaseDiagram);
htmlContent = htmlContent.replace('<h3 class="center">[DÁN ẢNH SƠ ĐỒ CLASS VÀO ĐÂY]</h3>', classDiagram);
htmlContent = htmlContent.replace('<h3 class="center">[DÁN ẢNH SƠ ĐỒ SEQUENCE AUTH VÀO ĐÂY]</h3>', seqAuth);
htmlContent = htmlContent.replace('<h3 class="center">[DÁN ẢNH SƠ ĐỒ SEQUENCE BOOKING VÀO ĐÂY]</h3>', seqBooking);

fs.writeFileSync('/Users/mac/Desktop/spa-booking/bao-cao-do-an.html', htmlContent);
console.log('Successfully injected Mermaid diagrams.');
