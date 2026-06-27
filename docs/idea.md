# AI Business Analyst Assistant - Ý tưởng ban đầu


## 0\. Tech Stack
1. frontend: Vite React tsx
2. backend + AI: FastApi
3. database: supabase

### limit time:
- Xay dung san pham trong toi da 3 hour
- Cuoc thi cua  hackathon
- Duoc Vibe coding


## 1\. Tên đề tài



**AI Business Analyst Assistant**



Hoặc



**Requirement Elicitation AI**



# 2\. Bối cảnh



Trong quá trình phát triển phần mềm, khách hàng thường chỉ mô tả ý tưởng ở mức rất chung chung.



Ví dụ:



- "Tôi muốn xây dựng ứng dụng đặt khách sạn."

- "Tôi muốn làm website bán hàng."

- "Tôi muốn xây hệ thống quản lý bệnh viện."



Những mô tả này chưa đủ để đội phát triển bắt đầu triển khai.



Business Analyst (BA) phải mất nhiều thời gian trao đổi với khách hàng để:



- Hiểu bài toán nghiệp vụ.

- Làm rõ mục tiêu kinh doanh.

- Xác định các chức năng cần có.

- Phát hiện các yêu cầu còn thiếu.

- Viết tài liệu đặc tả yêu cầu (SRS).



Quá trình này thường kéo dài qua nhiều buổi họp, làm tăng chi phí và thời gian triển khai dự án.



# 3\. Ý tưởng



Xây dựng một **AI Business Analyst Assistant** có khả năng đóng vai trò như một Business Analyst trong giai đoạn thu thập yêu cầu.



Thay vì chỉ trả lời câu hỏi của khách hàng, hệ thống sẽ chủ động phân tích yêu cầu, phát hiện những thông tin còn thiếu và đặt các câu hỏi phù hợp để giúp khách hàng mô tả đầy đủ bài toán.



Sau khi thu thập đủ thông tin, hệ thống sẽ tự động tạo ra tài liệu yêu cầu có cấu trúc và các sơ đồ mô tả nghiệp vụ.



# 4\. Mục tiêu



Hệ thống hướng tới các mục tiêu:



- Rút ngắn thời gian thu thập yêu cầu.

- Hỗ trợ khách hàng diễn đạt ý tưởng rõ ràng hơn.

- Giảm số lần trao đổi giữa khách hàng và Business Analyst.

- Chuẩn hóa yêu cầu trước khi chuyển sang đội phát triển.

- Sinh tài liệu Requirement tự động.



# 5\. Điểm khác biệt



Các chatbot AI hiện nay chủ yếu trả lời câu hỏi của người dùng.



Trong khi đó, hệ thống này hoạt động theo hướng **Requirement Elicitation**.



Nó sẽ:



- Phân tích yêu cầu.

- Hiểu lĩnh vực nghiệp vụ.

- Xác định những thông tin còn thiếu.

- Chủ động đặt câu hỏi.

- Cập nhật yêu cầu sau mỗi lần khách hàng trả lời.

- Chỉ kết thúc khi yêu cầu đủ hoàn chỉnh.



Nói cách khác, AI không chỉ "trả lời", mà còn "phỏng vấn" khách hàng giống như một Business Analyst thực thụ.



# 6\. Quy trình hoạt động



## Bước 1



Khách hàng nhập ý tưởng ban đầu.



Ví dụ:



Tôi muốn xây dựng ứng dụng đặt lịch khám bệnh.



## Bước 2



AI phân tích yêu cầu để xác định:



- Domain

- Mục tiêu nghiệp vụ

- Đối tượng sử dụng

- Các chức năng đã được đề cập



## Bước 3



AI tra cứu kiến thức nghiệp vụ theo đúng lĩnh vực.



Ví dụ:



Nếu hệ thống nhận biết đây là ứng dụng Healthcare thì AI sẽ tham khảo các quy trình và chức năng phổ biến của hệ thống đặt lịch khám bệnh.



## Bước 4



AI so sánh yêu cầu hiện tại với kiến thức nghiệp vụ để phát hiện các khoảng trống.



Ví dụ:



- Chưa có thanh toán.

- Chưa có hủy lịch.

- Chưa có hồ sơ bệnh nhân.

- Chưa có phân quyền bác sĩ.

- Chưa có thông báo.



## Bước 5



AI sinh các câu hỏi ưu tiên nhằm làm rõ yêu cầu.



Ví dụ:



- Có cần đăng nhập không?

- Có bao nhiêu loại tài khoản?

- Có thanh toán online không?

- Có gửi thông báo nhắc lịch không?

- Có lưu lịch sử khám không?



Khách hàng trả lời trực tiếp trong cuộc hội thoại.



## Bước 6



Sau mỗi câu trả lời, AI sẽ cập nhật Requirement và đánh giá mức độ hoàn thiện của yêu cầu.



Nếu còn thiếu thông tin, AI tiếp tục đặt câu hỏi.



Nếu đã đủ thông tin, AI chuyển sang bước sinh tài liệu.



## Bước 7



AI tự động sinh:



- Requirement Summary.

- Functional Requirements.

- Non-functional Requirements.

- Business Rules.

- User Stories.

- Use Case.

- Flow Diagram.

- Mindmap.

- Tài liệu SRS.



# 7\. Kiến trúc Multi-Agent



Để mô phỏng cách một Business Analyst làm việc, hệ thống được chia thành nhiều AI Agent với các vai trò riêng biệt.



### Requirement Analysis Agent



- Phân tích yêu cầu ban đầu.

- Xác định Domain.

- Xác định Actor.

- Xác định Business Goal.



### Research Agent



- Tra cứu kiến thức nghiệp vụ theo từng lĩnh vực.

- Cung cấp Best Practice.

- Cung cấp quy trình nghiệp vụ phổ biến.

- Cung cấp các chức năng thường gặp.



### Gap Analysis Agent



- So sánh Requirement hiện tại với kiến thức nghiệp vụ.

- Phát hiện Requirement còn thiếu.

- Đánh giá mức độ hoàn thiện.



### Question Planning Agent



- Sinh các câu hỏi phù hợp.

- Sắp xếp theo mức độ ưu tiên.

- Điều chỉnh câu hỏi dựa trên các câu trả lời trước đó.



### Requirement Generator Agent



- Tổng hợp toàn bộ Requirement.

- Sinh tài liệu đặc tả.

- Sinh sơ đồ nghiệp vụ.

- Xuất tài liệu hoàn chỉnh.



# 8\. Giá trị mang lại



Đối với khách hàng:



- Dễ mô tả ý tưởng.

- Không cần hiểu về phân tích nghiệp vụ.

- Có được tài liệu Requirement hoàn chỉnh.



Đối với Business Analyst:



- Giảm thời gian khai thác yêu cầu.

- Chuẩn hóa Requirement.

- Hạn chế bỏ sót chức năng.



Đối với đội phát triển:



- Nhận được tài liệu rõ ràng hơn.

- Giảm việc sửa Requirement nhiều lần.

- Tăng tốc độ triển khai dự án.



# 9\. Định hướng mở rộng



Trong tương lai, hệ thống có thể tích hợp thêm:



- RAG để tra cứu tài liệu nghiệp vụ từ nhiều nguồn.

- Sinh Jira Tickets tự động.

- Sinh Product Backlog.

- Sinh BPMN.

- Sinh Database Schema.

- Sinh API Specification.

- Sinh Prototype UI.

- Tích hợp với các công cụ quản lý dự án như Jira, Confluence hoặc Notion.



# 10\. Kết luận



AI Business Analyst Assistant không đơn thuần là một chatbot hỏi đáp, mà là một trợ lý phân tích nghiệp vụ sử dụng kiến trúc Multi-Agent để hỗ trợ toàn bộ quá trình thu thập và chuẩn hóa yêu cầu phần mềm.



Hệ thống giúp khách hàng diễn đạt ý tưởng đầy đủ hơn, hỗ trợ Business Analyst trong việc khai thác yêu cầu và tự động tạo ra tài liệu đặc tả chất lượng, góp phần rút ngắn thời gian phân tích nghiệp vụ và nâng cao hiệu quả triển khai dự án.
