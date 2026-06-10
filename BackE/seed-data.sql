USE [SmartClinicManagementSystemDb];
GO

SET NOCOUNT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @Doctor1Id UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222222';
    DECLARE @Doctor2Id UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222223';
    DECLARE @Patient1Id UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444444';
    DECLARE @Patient2Id UNIQUEIDENTIFIER = '55555555-5555-5555-5555-555555555555';
    DECLARE @Appointment1Id UNIQUEIDENTIFIER = '66666666-6666-6666-6666-666666666666';
    DECLARE @Appointment2Id UNIQUEIDENTIFIER = '77777777-7777-7777-7777-777777777777';
    DECLARE @MedicalRecord1Id UNIQUEIDENTIFIER = '88888888-8888-8888-8888-888888888888';
    DECLARE @MedicalRecord2Id UNIQUEIDENTIFIER = '99999999-9999-9999-9999-999999999999';
    DECLARE @Prescription1Id UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';
    DECLARE @Prescription2Id UNIQUEIDENTIFIER = 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB';
    DECLARE @Medicine1Id UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC';
    DECLARE @Medicine2Id UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD';
    DECLARE @Medicine3Id UNIQUEIDENTIFIER = 'EEEEEEEE-EEEE-EEEE-EEEE-EEEEEEEEEEEE';

    IF NOT EXISTS (SELECT 1 FROM Doctors WHERE Id IN (@Doctor1Id, @Doctor2Id))
    BEGIN
        INSERT INTO Doctors (Id, FullName, Specialty)
        VALUES
            (@Doctor1Id, N'Dr. Nguyen Van An', N'General Internal Medicine'),
            (@Doctor2Id, N'Dr. Tran Thi Bich', N'Pediatrics');
    END

    IF NOT EXISTS (SELECT 1 FROM Patients WHERE Id IN (@Patient1Id, @Patient2Id))
    BEGIN
        INSERT INTO Patients (Id, FullName, DateOfBirth, Gender, Phone, Address, CreatedAt)
        VALUES
            (@Patient1Id, N'Le Minh Khoa', '1998-04-12T00:00:00', N'Male', N'0901234567', N'District 1, Ho Chi Minh City', DATEADD(DAY, -30, SYSUTCDATETIME())),
            (@Patient2Id, N'Pham Thi Hoa', '2001-09-25T00:00:00', N'Female', N'0912345678', N'Thu Duc City, Ho Chi Minh City', DATEADD(DAY, -14, SYSUTCDATETIME()));
    END

    IF NOT EXISTS (SELECT 1 FROM Medicines WHERE Id IN (@Medicine1Id, @Medicine2Id, @Medicine3Id))
    BEGIN
        INSERT INTO Medicines (Id, Name, Description)
        VALUES
            (@Medicine1Id, N'Paracetamol 500mg', N'Pain reliever and fever reducer'),
            (@Medicine2Id, N'Amoxicillin 500mg', N'Antibiotic used for common bacterial infections'),
            (@Medicine3Id, N'Vitamin C 1000mg', N'Vitamin supplement');
    END

    IF NOT EXISTS (SELECT 1 FROM Appointments WHERE Id IN (@Appointment1Id, @Appointment2Id))
    BEGIN
        INSERT INTO Appointments (Id, PatientId, DoctorId, AppointmentDate, Status)
        VALUES
            (@Appointment1Id, @Patient1Id, @Doctor1Id, DATEADD(DAY, 1, SYSUTCDATETIME()), N'Scheduled'),
            (@Appointment2Id, @Patient2Id, @Doctor2Id, DATEADD(DAY, 2, SYSUTCDATETIME()), N'Completed');
    END

    IF NOT EXISTS (SELECT 1 FROM MedicalRecords WHERE Id IN (@MedicalRecord1Id, @MedicalRecord2Id))
    BEGIN
        INSERT INTO MedicalRecords (Id, AppointmentId, Symptoms, Diagnosis, Notes)
        VALUES
            (@MedicalRecord1Id, @Appointment2Id, N'Fever, sore throat, fatigue', N'Upper respiratory infection', N'Recommend rest, hydration, and follow-up if symptoms persist'),
            (@MedicalRecord2Id, @Appointment1Id, N'Headache and mild dizziness', N'Tension headache', N'Monitor condition and reduce screen time');
    END

    IF NOT EXISTS (SELECT 1 FROM Prescriptions WHERE Id IN (@Prescription1Id, @Prescription2Id))
    BEGIN
        INSERT INTO Prescriptions (Id, MedicalRecordId, CreatedAt)
        VALUES
            (@Prescription1Id, @MedicalRecord1Id, DATEADD(HOUR, -6, SYSUTCDATETIME())),
            (@Prescription2Id, @MedicalRecord2Id, DATEADD(HOUR, -3, SYSUTCDATETIME()));
    END

    IF NOT EXISTS (SELECT 1 FROM PrescriptionItems WHERE PrescriptionId IN (@Prescription1Id, @Prescription2Id))
    BEGIN
        INSERT INTO PrescriptionItems (Id, PrescriptionId, MedicineId, Dosage, Duration)
        VALUES
            ('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', @Prescription1Id, @Medicine1Id, N'1 tablet', N'3 times daily for 3 days'),
            ('12345678-1234-1234-1234-123456789001', @Prescription1Id, @Medicine2Id, N'1 capsule', N'2 times daily for 5 days'),
            ('12345678-1234-1234-1234-123456789002', @Prescription2Id, @Medicine3Id, N'1 tablet', N'Once daily for 7 days');
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

-- Lưu ý:
-- Bảng AppUsers không được seed ở đây vì mật khẩu của hệ thống dùng BCrypt,
-- nên bạn nên tạo tài khoản thông qua API đăng ký hoặc yêu cầu mình tạo thêm script riêng cho AppUsers.