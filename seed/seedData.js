const Department = require("../models/Department");
const User       = require("../models/User");
const Project    = require("../models/Project");
const Task       = require("../models/Task");
const TimeLog    = require("../models/TimeLog");

const daysAgo      = (n) => new Date(Date.now() - n * 864e5);
const daysFromNow  = (n) => new Date(Date.now() + n * 864e5);

const seedData = async () => {
  try {
    const hasData = await User.countDocuments();
    if (hasData > 0) {
      console.log("[Seed] Dữ liệu đã tồn tại, bỏ qua khởi tạo.");
      return;
    }

    // ─── 1. PHÒNG BAN ─────────────────────────────────────────────────────────
    const deptRaw = [
      { name: "Kỹ thuật phần mềm",    color: "#6366f1", description: "Phát triển và vận hành hệ thống phần mềm, API và hạ tầng kỹ thuật" },
      { name: "Thiết kế sản phẩm",    color: "#8b5cf6", description: "UX/UI Design, brand identity và trải nghiệm người dùng" },
      { name: "Marketing & Truyền thông", color: "#22d3ee", description: "Chiến lược marketing, content, digital marketing và quan hệ công chúng" },
      { name: "Kinh doanh",           color: "#34d399", description: "Phát triển kinh doanh, mở rộng thị trường và quản lý khách hàng" },
      { name: "Vận hành & Điều phối", color: "#fbbf24", description: "Quản lý vận hành, nhân sự, quy trình nội bộ và phân tích dữ liệu" },
    ];
    const departments = await Department.insertMany(deptRaw);
    const [engDept, desDept, mktDept, salesDept, opsDept] = departments;

    // ─── 2. NHÂN VIÊN (20) ────────────────────────────────────────────────────
    const usersRaw = [
      // Kỹ thuật phần mềm (6)
      { fullName: "Nguyễn Văn An",    email: "an.nv@hrmpro.vn",   department: engDept._id,  position: "Senior Backend Developer",  skills: ["Node.js","MongoDB","Docker","AWS","Redis"],           performanceScore: 9.1, workloadPercent: 85 },
      { fullName: "Lê Minh Đức",      email: "duc.lm@hrmpro.vn",  department: engDept._id,  position: "Backend Developer",         skills: ["Node.js","PostgreSQL","Python","Django"],             performanceScore: 7.8, workloadPercent: 70 },
      { fullName: "Trần Thị Bích",    email: "bich.tt@hrmpro.vn", department: engDept._id,  position: "Frontend Developer",        skills: ["React","Vue.js","TypeScript","HTML/CSS"],             performanceScore: 8.3, workloadPercent: 75 },
      { fullName: "Phạm Thị Hồng",    email: "hong.pt@hrmpro.vn", department: engDept._id,  position: "Python Developer",          skills: ["Python","Django","Redis","PostgreSQL","ML"],          performanceScore: 7.5, workloadPercent: 60 },
      { fullName: "Hoàng Văn Khánh",  email: "khanh.hv@hrmpro.vn",department: engDept._id,  position: "DevOps Engineer",           skills: ["Docker","Kubernetes","CI/CD","Linux","AWS"],          performanceScore: 8.9, workloadPercent: 55 },
      { fullName: "Cao Minh Bạch",    email: "bach.cm@hrmpro.vn", department: engDept._id,  position: "Mobile Developer",          skills: ["React Native","Flutter","iOS","Android"],             performanceScore: 7.2, workloadPercent: 65 },
      // Thiết kế sản phẩm (3)
      { fullName: "Nguyễn Thị Lan",   email: "lan.nt@hrmpro.vn",  department: desDept._id,  position: "UI/UX Lead Designer",       skills: ["Figma","Adobe XD","Sketch","Prototyping","Branding"], performanceScore: 9.0, workloadPercent: 80 },
      { fullName: "Võ Thị Mai",       email: "mai.vt@hrmpro.vn",  department: desDept._id,  position: "Visual Designer",           skills: ["Illustrator","Photoshop","Figma","Motion Graphics"],  performanceScore: 7.6, workloadPercent: 50 },
      { fullName: "Vũ Thị Cẩm",       email: "cam.vt@hrmpro.vn",  department: desDept._id,  position: "UX Researcher",             skills: ["User Research","Figma","Data Analysis","Prototyping"], performanceScore: 6.8, workloadPercent: 45 },
      // Marketing & Truyền thông (3)
      { fullName: "Đỗ Thị Nga",       email: "nga.dt@hrmpro.vn",  department: mktDept._id,  position: "Marketing Manager",         skills: ["Digital Marketing","SEO","Google Ads","Analytics"],   performanceScore: 8.5, workloadPercent: 70 },
      { fullName: "Lý Văn Phát",      email: "phat.lv@hrmpro.vn", department: mktDept._id,  position: "Content Creator",           skills: ["Copywriting","Social Media","Video Editing","Canva"], performanceScore: 6.4, workloadPercent: 40 },
      { fullName: "Bùi Thị Phương",   email: "phuong.bt@hrmpro.vn",department: mktDept._id, position: "Social Media Specialist",   skills: ["Social Media","Canva","Analytics","Facebook Ads"],   performanceScore: 7.1, workloadPercent: 55 },
      // Kinh doanh (4)
      { fullName: "Đặng Văn Vinh",    email: "vinh.dv@hrmpro.vn", department: salesDept._id,position: "Sales Manager",             skills: ["Sales","CRM","Negotiation","Market Research"],        performanceScore: 8.7, workloadPercent: 75 },
      { fullName: "Hoàng Thị Uyên",   email: "uyen.ht@hrmpro.vn", department: salesDept._id,position: "Account Executive",         skills: ["CRM","Excel","Presentation","Partnership"],           performanceScore: 7.9, workloadPercent: 60 },
      { fullName: "Phạm Văn Tuấn",    email: "tuan.pv@hrmpro.vn", department: salesDept._id,position: "Business Development",      skills: ["Strategy","CRM","Market Research","Negotiation"],     performanceScore: 6.9, workloadPercent: 50 },
      { fullName: "Trần Văn Quang",   email: "quang.tv@hrmpro.vn",department: salesDept._id,position: "Sales Executive",           skills: ["Sales","Analytics","CRM","Excel"],                   performanceScore: 7.3, workloadPercent: 55 },
      // Vận hành & Điều phối (4)
      { fullName: "Nguyễn Thị Xuân",  email: "xuan.nt@hrmpro.vn", department: opsDept._id,  position: "Project Manager",           skills: ["Project Management","Scrum","Excel","Risk Management"],performanceScore: 8.8, workloadPercent: 75 },
      { fullName: "Trần Văn Yên",     email: "yen.tv@hrmpro.vn",  department: opsDept._id,  position: "Operations Lead",           skills: ["Process Optimization","Excel","Analytics","Six Sigma"],performanceScore: 7.2, workloadPercent: 50 },
      { fullName: "Lê Thị Zy",        email: "zy.lt@hrmpro.vn",   department: opsDept._id,  position: "HR Specialist",             skills: ["Tuyển dụng","Đào tạo","Quản lý nhân sự","Luật lao động"],performanceScore: 5.5, workloadPercent: 25 },
      { fullName: "Đinh Văn Đô",      email: "do.dv@hrmpro.vn",   department: opsDept._id,  position: "Data Analyst",              skills: ["Python","SQL","Tableau","Analytics","Excel"],          performanceScore: 7.9, workloadPercent: 65 },
    ];
    const users = await User.insertMany(usersRaw);
    const u = {};
    users.forEach(user => { u[user.fullName] = user; });

    // ─── 3. DỰ ÁN (10) ────────────────────────────────────────────────────────
    const projectsRaw = [
      {
        name: "Nền tảng thương mại điện tử NextGen",
        description: `Xây dựng nền tảng e-commerce B2C thế hệ mới tích hợp AI recommendation engine và hệ thống thanh toán đa kênh.\n\nNgười tham gia: Nguyễn Văn An (Backend Lead), Lê Minh Đức (Backend Dev), Trần Thị Bích (Frontend Dev), Phạm Thị Hồng (Search/AI), Hoàng Văn Khánh (DevOps).\n\nYêu cầu tham gia: Có kinh nghiệm tối thiểu 2 năm với Node.js hoặc React. Ưu tiên ứng viên đã từng làm hệ thống thương mại điện tử quy mô lớn.\n\nKỹ năng yêu cầu: Node.js, MongoDB, React, Docker, CI/CD, thanh toán trực tuyến.`,
        department: engDept._id, status: "Active", startDate: daysAgo(90), deadline: daysFromNow(60), progress: 65,
      },
      {
        name: "Ứng dụng di động dịch vụ khách hàng",
        description: `Phát triển ứng dụng mobile đa nền tảng cho iOS và Android, tích hợp chat hỗ trợ realtime và hệ thống thông báo đẩy.\n\nNgười tham gia: Cao Minh Bạch (Mobile Lead), Lê Minh Đức (Backend API), Nguyễn Văn An (Backend Senior), Nguyễn Thị Lan (UX Design).\n\nYêu cầu tham gia: Thành thạo React Native hoặc Flutter. Ưu tiên có kinh nghiệm publish app lên App Store/CH Play.\n\nKỹ năng yêu cầu: React Native, Flutter, Node.js, Push Notification, UX/UI Mobile.`,
        department: engDept._id, status: "Active", startDate: daysAgo(60), deadline: daysFromNow(90), progress: 40,
      },
      {
        name: "Redesign Website Thương hiệu 2026",
        description: `Thiết kế lại toàn bộ website công ty theo brand guidelines mới, tập trung nâng cao trải nghiệm người dùng và tốc độ tải trang.\n\nNgười tham gia: Nguyễn Thị Lan (Lead Designer), Võ Thị Mai (Visual Design), Vũ Thị Cẩm (UX Research), Trần Thị Bích (Frontend Dev).\n\nYêu cầu tham gia: Thành thạo Figma và có hiểu biết về frontend. Yêu cầu portfolio thiết kế website ít nhất 3 dự án thực tế.\n\nKỹ năng yêu cầu: Figma, Adobe XD, Branding, HTML/CSS cơ bản, User Research.`,
        department: desDept._id, status: "Active", startDate: daysAgo(45), deadline: daysFromNow(30), progress: 75,
      },
      {
        name: "Chiến dịch Marketing Q3/2026",
        description: `Chiến dịch tổng thể Q3 bao gồm digital marketing, content và PR nhằm tăng brand awareness 40% và lead generation 25%.\n\nNgười tham gia: Đỗ Thị Nga (Marketing Manager/Lead), Lý Văn Phát (Content), Bùi Thị Phương (Social Media), Vũ Thị Cẩm (UX hỗ trợ landing page).\n\nYêu cầu tham gia: Có kinh nghiệm chạy Google Ads, Facebook Ads. Ưu tiên ứng viên có chứng chỉ Google Analytics hoặc HubSpot.\n\nKỹ năng yêu cầu: Digital Marketing, SEO/SEM, Social Media, Content Marketing, Analytics.`,
        department: mktDept._id, status: "Active", startDate: daysAgo(30), deadline: daysFromNow(61), progress: 50,
      },
      {
        name: "Hệ thống CRM nội bộ v2.0",
        description: `Nâng cấp CRM hiện tại với tính năng AI scoring khách hàng, tự động hóa pipeline bán hàng và báo cáo thời gian thực.\n\nNgười tham gia: Nguyễn Văn An (Backend Lead), Phạm Thị Hồng (AI/ML), Trần Thị Bích (Frontend), Nguyễn Thị Xuân (PM).\n\nYêu cầu tham gia: Yêu cầu kinh nghiệm với hệ thống CRM (Salesforce, HubSpot). Ưu tiên biết tích hợp API bên thứ 3.\n\nKỹ năng yêu cầu: Node.js, React, Python, ML, PostgreSQL, CRM Integration.`,
        department: engDept._id, status: "Planning", startDate: daysFromNow(15), deadline: daysFromNow(120), progress: 10,
      },
      {
        name: "Tối ưu quy trình vận hành",
        description: `Phân tích và tối ưu toàn bộ luồng quy trình nội bộ theo phương pháp Lean Six Sigma, mục tiêu giảm thời gian xử lý 30%.\n\nNgười tham gia: Nguyễn Thị Xuân (PM/Lead), Trần Văn Yên (Operations Lead), Đinh Văn Đô (Data Analyst), Lê Thị Zy (HR phối hợp).\n\nYêu cầu tham gia: Hiểu biết về quy trình quản lý vận hành. Ưu tiên có chứng chỉ PMP hoặc Six Sigma.\n\nKỹ năng yêu cầu: Process Optimization, Six Sigma, Excel, Analytics, Project Management.`,
        department: opsDept._id, status: "Active", startDate: daysAgo(75), deadline: daysFromNow(15), progress: 80,
      },
      {
        name: "Phân tích dữ liệu kinh doanh Q2/2026",
        description: `Báo cáo phân tích chuyên sâu kết quả kinh doanh Q2, bao gồm phân tích doanh thu, hành vi khách hàng và đề xuất chiến lược Q3.\n\nNgười tham gia: Đinh Văn Đô (Data Analyst/Lead), Trần Văn Quang (Sales data), Nguyễn Thị Xuân (Business context).\n\nDự án đã hoàn thành thành công, báo cáo được ban lãnh đạo phê duyệt ngày ${daysAgo(10).toLocaleDateString("vi-VN")}.\n\nKỹ năng yêu cầu: Python, SQL, Tableau, Analytics, Excel, PowerPoint.`,
        department: opsDept._id, status: "Completed", startDate: daysAgo(120), deadline: daysAgo(10), progress: 100,
      },
      {
        name: "Mở rộng thị trường khu vực miền Nam",
        description: `Kế hoạch thâm nhập và mở rộng thị trường TP.HCM và các tỉnh lân cận, mục tiêu đạt 100 khách hàng mới trong 6 tháng.\n\nNgười tham gia: Đặng Văn Vinh (Sales Manager/Lead), Hoàng Thị Uyên (Account Executive), Phạm Văn Tuấn (Business Dev), Trần Văn Quang (Sales Exec).\n\nYêu cầu tham gia: Có quan hệ doanh nghiệp tại khu vực TP.HCM. Ưu tiên ứng viên biết tiếng Anh thương mại để gặp đối tác nước ngoài.\n\nKỹ năng yêu cầu: Sales, CRM, Negotiation, Market Research, Partnership Development.`,
        department: salesDept._id, status: "Active", startDate: daysAgo(40), deadline: daysFromNow(50), progress: 35,
      },
      {
        name: "Hệ thống báo cáo tự động HRM",
        description: `Tự động hóa quy trình tạo báo cáo nhân sự định kỳ (tuần/tháng/quý), tích hợp trực tiếp với hệ thống HRM hiện tại.\n\nDự án đã hoàn thành xuất sắc, giảm 8 giờ công/tuần cho bộ phận nhân sự.\n\nNgười tham gia: Lê Minh Đức (Backend Lead), Phạm Thị Hồng (Python Dev), Hoàng Văn Khánh (DevOps), Nguyễn Thị Xuân (PM).\n\nKỹ năng yêu cầu: Node.js, Python, PostgreSQL, Docker, Report Automation.`,
        department: engDept._id, status: "Completed", startDate: daysAgo(150), deadline: daysAgo(30), progress: 100,
      },
      {
        name: "Chương trình đào tạo nhân viên mới",
        description: `Xây dựng chương trình onboarding và đào tạo chuẩn hóa cho nhân viên mới, bao gồm tài liệu học liệu, bài kiểm tra và mentor matching.\n\nNgười tham gia: Lê Thị Zy (HR Lead), Nguyễn Thị Xuân (PM), Trần Văn Yên (Vận hành), Đinh Văn Đô (Hệ thống đánh giá).\n\nYêu cầu tham gia: Kinh nghiệm thiết kế chương trình đào tạo. Ưu tiên ứng viên có kiến thức về học liệu điện tử (e-learning).\n\nKỹ năng yêu cầu: HR Management, Training Design, E-learning, Project Management, Excel.`,
        department: opsDept._id, status: "Planning", startDate: daysFromNow(5), deadline: daysFromNow(90), progress: 5,
      },
    ];
    const projects = await Project.insertMany(projectsRaw);
    const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10] = projects;

    // ─── 4. CÔNG VIỆC (60) ────────────────────────────────────────────────────
    const tasksRaw = [
      // p1 - Nền tảng thương mại điện tử (10)
      { project: p1._id, name: "Thiết kế kiến trúc microservices",      assignee: u["Nguyễn Văn An"]._id,   priority: "High",   status: "Completed",   estimatedHours: 40, requiredSkills: ["Node.js","Docker","MongoDB"],     deadline: daysAgo(50),  completedAt: daysAgo(48) },
      { project: p1._id, name: "Phát triển API sản phẩm và danh mục",   assignee: u["Lê Minh Đức"]._id,     priority: "High",   status: "Completed",   estimatedHours: 60, requiredSkills: ["Node.js","MongoDB"],              deadline: daysAgo(30),  completedAt: daysAgo(28) },
      { project: p1._id, name: "Xây dựng giao diện trang chủ và listing",assignee: u["Trần Thị Bích"]._id,  priority: "High",   status: "In Progress", estimatedHours: 80, requiredSkills: ["React","HTML/CSS"],               deadline: daysFromNow(10) },
      { project: p1._id, name: "Tích hợp cổng thanh toán VNPay/MoMo",   assignee: u["Nguyễn Văn An"]._id,   priority: "Urgent", status: "In Progress", estimatedHours: 32, requiredSkills: ["Node.js","Python"],               deadline: daysFromNow(7) },
      { project: p1._id, name: "Module giỏ hàng và checkout",            assignee: u["Lê Minh Đức"]._id,     priority: "High",   status: "In Progress", estimatedHours: 48, requiredSkills: ["React","Node.js"],                deadline: daysFromNow(14) },
      { project: p1._id, name: "Cấu hình CI/CD pipeline",               assignee: u["Hoàng Văn Khánh"]._id, priority: "Medium", status: "Completed",   estimatedHours: 24, requiredSkills: ["Docker","CI/CD","AWS"],            deadline: daysAgo(20),  completedAt: daysAgo(22) },
      { project: p1._id, name: "Tối ưu SEO và hiệu năng frontend",      assignee: u["Trần Thị Bích"]._id,   priority: "Medium", status: "Not Started", estimatedHours: 20, requiredSkills: ["React","HTML/CSS"],               deadline: daysFromNow(25) },
      { project: p1._id, name: "Module tìm kiếm và lọc sản phẩm (AI)",  assignee: u["Phạm Thị Hồng"]._id,  priority: "High",   status: "In Progress", estimatedHours: 36, requiredSkills: ["Python","Redis"],                 deadline: daysFromNow(12) },
      { project: p1._id, name: "Hệ thống đánh giá và review sản phẩm",  assignee: u["Phạm Thị Hồng"]._id,  priority: "Low",    status: "Not Started", estimatedHours: 28, requiredSkills: ["Python","PostgreSQL"],             deadline: daysFromNow(40) },
      { project: p1._id, name: "Kiểm thử toàn diện và viết tài liệu",   assignee: u["Hoàng Văn Khánh"]._id, priority: "Medium", status: "Not Started", estimatedHours: 40, requiredSkills: ["Docker","Linux"],                 deadline: daysFromNow(55) },

      // p2 - Ứng dụng di động (6)
      { project: p2._id, name: "Thiết kế wireframe ứng dụng mobile",    assignee: u["Nguyễn Thị Lan"]._id,  priority: "High",   status: "Completed",   estimatedHours: 30, requiredSkills: ["Figma","Prototyping"],            deadline: daysAgo(40),  completedAt: daysAgo(38) },
      { project: p2._id, name: "Phát triển màn hình đăng nhập & xác thực",assignee: u["Cao Minh Bạch"]._id, priority: "High",   status: "Completed",   estimatedHours: 24, requiredSkills: ["React Native","iOS","Android"],   deadline: daysAgo(25),  completedAt: daysAgo(23) },
      { project: p2._id, name: "Màn hình danh sách dịch vụ",            assignee: u["Cao Minh Bạch"]._id,   priority: "High",   status: "In Progress", estimatedHours: 40, requiredSkills: ["React Native","Flutter"],          deadline: daysFromNow(20) },
      { project: p2._id, name: "Tích hợp push notification",             assignee: u["Cao Minh Bạch"]._id,   priority: "Medium", status: "Not Started", estimatedHours: 16, requiredSkills: ["React Native","iOS","Android"],   deadline: daysFromNow(35) },
      { project: p2._id, name: "Module chat hỗ trợ khách hàng realtime", assignee: u["Lê Minh Đức"]._id,     priority: "High",   status: "In Progress", estimatedHours: 48, requiredSkills: ["Node.js","React Native"],          deadline: daysFromNow(25) },
      { project: p2._id, name: "API backend cho ứng dụng mobile",        assignee: u["Nguyễn Văn An"]._id,   priority: "High",   status: "In Progress", estimatedHours: 56, requiredSkills: ["Node.js","MongoDB"],              deadline: daysFromNow(30) },

      // p3 - Redesign Website (7)
      { project: p3._id, name: "Nghiên cứu người dùng và thu thập yêu cầu",assignee: u["Vũ Thị Cẩm"]._id,   priority: "High",   status: "Completed",   estimatedHours: 20, requiredSkills: ["User Research","Figma"],          deadline: daysAgo(35),  completedAt: daysAgo(33) },
      { project: p3._id, name: "Thiết kế hệ thống Design System mới",   assignee: u["Nguyễn Thị Lan"]._id,  priority: "High",   status: "Completed",   estimatedHours: 40, requiredSkills: ["Figma","Branding"],               deadline: daysAgo(25),  completedAt: daysAgo(24) },
      { project: p3._id, name: "Thiết kế trang chủ và landing pages",   assignee: u["Nguyễn Thị Lan"]._id,  priority: "High",   status: "Completed",   estimatedHours: 36, requiredSkills: ["Figma","Adobe XD"],               deadline: daysAgo(15),  completedAt: daysAgo(14) },
      { project: p3._id, name: "Thiết kế trang sản phẩm và portfolio",  assignee: u["Võ Thị Mai"]._id,      priority: "High",   status: "In Progress", estimatedHours: 32, requiredSkills: ["Illustrator","Figma"],             deadline: daysFromNow(5) },
      { project: p3._id, name: "Tạo motion graphics và animation",      assignee: u["Vũ Thị Cẩm"]._id,      priority: "Medium", status: "In Progress", estimatedHours: 24, requiredSkills: ["Motion Graphics","Figma"],         deadline: daysFromNow(10) },
      { project: p3._id, name: "Triển khai frontend từ thiết kế",       assignee: u["Trần Thị Bích"]._id,   priority: "High",   status: "In Progress", estimatedHours: 60, requiredSkills: ["React","HTML/CSS","TypeScript"],   deadline: daysFromNow(25) },
      { project: p3._id, name: "Kiểm thử cross-browser và responsive",  assignee: u["Võ Thị Mai"]._id,      priority: "Medium", status: "Not Started", estimatedHours: 16, requiredSkills: ["HTML/CSS","Testing"],              deadline: daysFromNow(30) },

      // p4 - Marketing Q3 (6)
      { project: p4._id, name: "Lập kế hoạch và ngân sách chiến dịch",  assignee: u["Đỗ Thị Nga"]._id,      priority: "High",   status: "Completed",   estimatedHours: 20, requiredSkills: ["Digital Marketing","Analytics"],  deadline: daysAgo(25),  completedAt: daysAgo(23) },
      { project: p4._id, name: "Sản xuất nội dung blog và bài viết SEO",assignee: u["Lý Văn Phát"]._id,     priority: "Medium", status: "In Progress", estimatedHours: 40, requiredSkills: ["Copywriting","SEO"],              deadline: daysFromNow(30) },
      { project: p4._id, name: "Thiết kế creatives quảng cáo",          assignee: u["Bùi Thị Phương"]._id,  priority: "High",   status: "In Progress", estimatedHours: 30, requiredSkills: ["Canva","Social Media"],            deadline: daysFromNow(20) },
      { project: p4._id, name: "Triển khai chiến dịch Google Ads",      assignee: u["Đỗ Thị Nga"]._id,      priority: "Urgent", status: "In Progress", estimatedHours: 16, requiredSkills: ["Google Ads","Analytics"],          deadline: daysFromNow(7) },
      { project: p4._id, name: "Quản lý Social Media và engagement",    assignee: u["Bùi Thị Phương"]._id,  priority: "Medium", status: "In Progress", estimatedHours: 48, requiredSkills: ["Social Media","Facebook Ads"],    deadline: daysFromNow(61) },
      { project: p4._id, name: "Đo lường kết quả và báo cáo ROI",      assignee: u["Đỗ Thị Nga"]._id,      priority: "Medium", status: "Not Started", estimatedHours: 12, requiredSkills: ["Analytics","Google Analytics"],   deadline: daysFromNow(65) },

      // p5 - CRM v2.0 Planning (3)
      { project: p5._id, name: "Khảo sát yêu cầu từ phòng kinh doanh", assignee: u["Nguyễn Thị Xuân"]._id, priority: "High",   status: "In Progress", estimatedHours: 16, requiredSkills: ["Project Management","Scrum"],     deadline: daysFromNow(20) },
      { project: p5._id, name: "Thiết kế kiến trúc hệ thống CRM mới",  assignee: u["Nguyễn Văn An"]._id,   priority: "High",   status: "Not Started", estimatedHours: 32, requiredSkills: ["Node.js","MongoDB"],              deadline: daysFromNow(35) },
      { project: p5._id, name: "Nghiên cứu giải pháp AI scoring KH",   assignee: u["Phạm Thị Hồng"]._id,   priority: "Medium", status: "Not Started", estimatedHours: 24, requiredSkills: ["Python","ML"],                   deadline: daysFromNow(45) },

      // p6 - Tối ưu vận hành (5)
      { project: p6._id, name: "Lập bản đồ quy trình hiện tại (As-Is)", assignee: u["Trần Văn Yên"]._id,    priority: "High",   status: "Completed",   estimatedHours: 24, requiredSkills: ["Process Optimization","Excel"],   deadline: daysAgo(55),  completedAt: daysAgo(53) },
      { project: p6._id, name: "Phân tích điểm nghẽn và lãng phí",     assignee: u["Đinh Văn Đô"]._id,     priority: "High",   status: "Completed",   estimatedHours: 32, requiredSkills: ["Analytics","Six Sigma"],          deadline: daysAgo(40),  completedAt: daysAgo(38) },
      { project: p6._id, name: "Thiết kế quy trình mới (To-Be)",        assignee: u["Nguyễn Thị Xuân"]._id, priority: "High",   status: "Completed",   estimatedHours: 28, requiredSkills: ["Project Management","Scrum"],     deadline: daysAgo(25),  completedAt: daysAgo(24) },
      { project: p6._id, name: "Thí điểm áp dụng quy trình mới",       assignee: u["Trần Văn Yên"]._id,    priority: "High",   status: "In Progress", estimatedHours: 40, requiredSkills: ["Process Optimization","Excel"],   deadline: daysFromNow(10) },
      { project: p6._id, name: "Đánh giá kết quả và chuẩn hóa toàn công ty",assignee: u["Đinh Văn Đô"]._id,priority: "Medium", status: "Not Started", estimatedHours: 20, requiredSkills: ["Analytics","Six Sigma"],          deadline: daysFromNow(20) },

      // p7 - Phân tích dữ liệu Q2 - Hoàn thành (5)
      { project: p7._id, name: "Thu thập và làm sạch dữ liệu Q2",      assignee: u["Đinh Văn Đô"]._id,     priority: "High",   status: "Completed",   estimatedHours: 24, requiredSkills: ["Python","SQL"],                   deadline: daysAgo(60),  completedAt: daysAgo(58) },
      { project: p7._id, name: "Phân tích dữ liệu doanh thu và tăng trưởng",assignee: u["Đinh Văn Đô"]._id,priority: "High",   status: "Completed",   estimatedHours: 32, requiredSkills: ["Python","Tableau"],               deadline: daysAgo(45),  completedAt: daysAgo(43) },
      { project: p7._id, name: "Phân tích hành vi khách hàng",          assignee: u["Trần Văn Quang"]._id,  priority: "Medium", status: "Completed",   estimatedHours: 20, requiredSkills: ["Analytics","Google Analytics"],   deadline: daysAgo(30),  completedAt: daysAgo(28) },
      { project: p7._id, name: "Tạo dashboard báo cáo trực quan",       assignee: u["Đinh Văn Đô"]._id,     priority: "High",   status: "Completed",   estimatedHours: 28, requiredSkills: ["Tableau","SQL"],                  deadline: daysAgo(20),  completedAt: daysAgo(18) },
      { project: p7._id, name: "Viết báo cáo tổng hợp và đề xuất CL",  assignee: u["Nguyễn Thị Xuân"]._id, priority: "Medium", status: "Completed",   estimatedHours: 16, requiredSkills: ["Excel","Analytics"],               deadline: daysAgo(10),  completedAt: daysAgo(11) },

      // p8 - Mở rộng thị trường miền Nam (5)
      { project: p8._id, name: "Nghiên cứu thị trường miền Nam",        assignee: u["Đặng Văn Vinh"]._id,   priority: "High",   status: "Completed",   estimatedHours: 40, requiredSkills: ["Market Research","Strategy"],     deadline: daysAgo(30),  completedAt: daysAgo(28) },
      { project: p8._id, name: "Xây dựng danh sách khách hàng tiềm năng",assignee: u["Hoàng Thị Uyên"]._id, priority: "High",   status: "In Progress", estimatedHours: 32, requiredSkills: ["CRM","Excel"],                    deadline: daysFromNow(15) },
      { project: p8._id, name: "Phát triển quan hệ đối tác địa phương", assignee: u["Đặng Văn Vinh"]._id,   priority: "High",   status: "In Progress", estimatedHours: 48, requiredSkills: ["Partnership","Negotiation"],       deadline: daysFromNow(30) },
      { project: p8._id, name: "Thiết kế chương trình khuyến mãi khu vực",assignee: u["Phạm Văn Tuấn"]._id, priority: "Medium", status: "In Progress", estimatedHours: 20, requiredSkills: ["Strategy","CRM"],                 deadline: daysFromNow(20) },
      { project: p8._id, name: "Tuyển dụng và đào tạo đội sales địa phương",assignee: u["Bùi Thị Phương"]._id,priority:"Low",  status: "Not Started", estimatedHours: 30, requiredSkills: ["Presentation","CRM"],              deadline: daysFromNow(50) },

      // p9 - Báo cáo HRM tự động - Hoàn thành (5)
      { project: p9._id, name: "Phân tích yêu cầu và thiết kế giải pháp",assignee: u["Nguyễn Thị Xuân"]._id,priority: "Medium", status: "Completed",   estimatedHours: 16, requiredSkills: ["Project Management","Excel"],     deadline: daysAgo(120), completedAt: daysAgo(118) },
      { project: p9._id, name: "Thiết kế template báo cáo chuẩn",       assignee: u["Đinh Văn Đô"]._id,     priority: "High",   status: "Completed",   estimatedHours: 24, requiredSkills: ["SQL","Tableau"],                  deadline: daysAgo(100), completedAt: daysAgo(98) },
      { project: p9._id, name: "Phát triển module xuất báo cáo tự động",assignee: u["Lê Minh Đức"]._id,     priority: "High",   status: "Completed",   estimatedHours: 60, requiredSkills: ["Node.js","PostgreSQL"],            deadline: daysAgo(60),  completedAt: daysAgo(57) },
      { project: p9._id, name: "Tích hợp với hệ thống HR hiện tại",    assignee: u["Phạm Thị Hồng"]._id,   priority: "High",   status: "Completed",   estimatedHours: 40, requiredSkills: ["Python","Django"],                 deadline: daysAgo(45),  completedAt: daysAgo(42) },
      { project: p9._id, name: "Kiểm thử và go-live lên môi trường Production",assignee: u["Hoàng Văn Khánh"]._id,priority:"Medium",status:"Completed",estimatedHours: 20, requiredSkills: ["Docker","Linux"],                 deadline: daysAgo(30),  completedAt: daysAgo(31) },

      // p10 - Chương trình đào tạo (4)
      { project: p10._id, name: "Khảo sát nhu cầu đào tạo toàn công ty", assignee: u["Lê Thị Zy"]._id,     priority: "Medium", status: "In Progress", estimatedHours: 16, requiredSkills: ["HR Management","Excel"],           deadline: daysFromNow(10) },
      { project: p10._id, name: "Thiết kế chương trình đào tạo chuẩn",  assignee: u["Lê Thị Zy"]._id,      priority: "High",   status: "Not Started", estimatedHours: 32, requiredSkills: ["Training","HR Management"],        deadline: daysFromNow(30) },
      { project: p10._id, name: "Xây dựng tài liệu và học liệu điện tử",assignee: u["Trần Văn Yên"]._id,   priority: "Medium", status: "Not Started", estimatedHours: 40, requiredSkills: ["Excel","Process Optimization"],    deadline: daysFromNow(50) },
      { project: p10._id, name: "Triển khai thí điểm batch đầu tiên",   assignee: u["Nguyễn Thị Xuân"]._id, priority: "Low",   status: "Not Started", estimatedHours: 24, requiredSkills: ["Project Management","Scrum"],     deadline: daysFromNow(75) },
    ];
    const tasks = await Task.insertMany(tasksRaw);

    // ─── 5. TIME LOGS ─────────────────────────────────────────────────────────
    const notePool = [
      "Hoàn thành đúng tiến độ, chất lượng tốt",
      "Gặp một số vấn đề kỹ thuật nhưng đã giải quyết được",
      "Cần tham khảo thêm tài liệu, tiến độ chậm hơn dự kiến",
      "Làm việc hiệu quả, vượt kỳ vọng của team",
      "Phối hợp tốt với các thành viên, output đạt chất lượng cao",
      "Phần lớn công việc đã hoàn thành, còn review lần cuối",
      "Đang xử lý các edge cases phức tạp",
      "Review với team lead và nhận phản hồi tích cực",
      "Đã kiểm thử và sửa các bug chính, sẵn sàng merge",
      "Hoàn thiện theo feedback từ code review, sắp hoàn thành",
    ];

    const rand    = (min, max) => Math.random() * (max - min) + min;
    const randInt = (min, max) => Math.floor(rand(min, max + 1));
    const randNote = () => notePool[randInt(0, notePool.length - 1)];

    const timeLogsData = [];
    const completedTasks  = tasks.filter(t => t.status === "Completed");
    const inProgressTasks = tasks.filter(t => t.status === "In Progress");

    for (const task of completedTasks) {
      const numLogs = randInt(2, 4);
      for (let i = 0; i < numLogs; i++) {
        const hrs = Math.round((task.estimatedHours / numLogs) * rand(0.8, 1.2) * 10) / 10;
        timeLogsData.push({
          task: task._id, staff: task.assignee,
          hoursWorked: hrs,
          date: daysAgo(randInt(20, 60) - i * 4),
          notes: randNote(),
          qualityRating: randInt(4, 5),
          approvalStatus: "approved",
          approvedAt: daysAgo(randInt(1, 10)),
        });
      }
    }

    for (const task of inProgressTasks) {
      const numLogs = randInt(1, 3);
      for (let i = 0; i < numLogs; i++) {
        const hrs = Math.round(task.estimatedHours * rand(0.2, 0.4) * 10) / 10;
        timeLogsData.push({
          task: task._id, staff: task.assignee,
          hoursWorked: hrs,
          date: daysAgo(randInt(1, 14) - i * 2),
          notes: randNote(),
          qualityRating: randInt(3, 5),
          approvalStatus: "pending",
        });
      }
    }

    await TimeLog.insertMany(timeLogsData);

    console.log("[Seed] =================================");
    console.log("[Seed] Khởi tạo dữ liệu thành công!");
    console.log(`[Seed]   Phòng ban  : ${departments.length}`);
    console.log(`[Seed]   Nhân viên  : ${users.length}`);
    console.log(`[Seed]   Dự án      : ${projects.length}`);
    console.log(`[Seed]   Công việc  : ${tasks.length}`);
    console.log(`[Seed]   Time logs  : ${timeLogsData.length}`);
    console.log("[Seed] =================================");

  } catch (err) {
    console.error("[Seed] Lỗi khởi tạo:", err.message);
  }
};

module.exports = seedData;
