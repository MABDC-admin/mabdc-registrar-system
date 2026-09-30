<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AdmissionController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\DocumentRequirementController;
use App\Http\Controllers\AcademicRecordController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\LearnerController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StudentManagementController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\TransferWithdrawalController;
use App\Http\Controllers\FeeStructureController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\LearnerAccountController;
use App\Http\Controllers\AcademicYearController;
use App\Http\Controllers\FinanceReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\TeacherProfileController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\HouseholdController;
use App\Http\Controllers\AuditTrailController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified', 'role:registrar,admin,finance'])
    ->name('dashboard');

Route::middleware(['auth', 'role:registrar,admin,finance'])->group(function () {
    Route::get('/households', [HouseholdController::class, 'index'])->name('households.index');
    Route::post('/households', [HouseholdController::class, 'store'])
        ->middleware('module:student_management')->name('households.store');
    Route::post('/households/{household}/link', [HouseholdController::class, 'linkLearner'])
        ->middleware('module:student_management')->name('households.link');
    Route::delete('/households/{household}/unlink/{learner}', [HouseholdController::class, 'unlinkLearner'])
        ->middleware('module:student_management')->name('households.unlink');

    Route::get('/student-management', StudentManagementController::class)
        ->middleware('module:student_management')
        ->name('student-management.index');

    Route::get('/enrollments', EnrollmentController::class)
        ->middleware('module:enrollment')
        ->name('enrollments.index');

    Route::get('/promotions', [PromotionController::class, 'index'])
        ->name('promotions.index');
    Route::post('/promotions', [PromotionController::class, 'store'])
        ->middleware('module:enrollment')
        ->name('promotions.store');

    Route::get('/academic-records', [AcademicRecordController::class, 'index'])
        ->middleware('module:academic_records')
        ->name('academic-records.index');
    Route::get('/academic-records/{learner}', [AcademicRecordController::class, 'show'])
        ->middleware('module:academic_records')
        ->name('academic-records.show');

    Route::get('/reports', ReportController::class)
        ->middleware('module:reports')
        ->name('reports.index');

    Route::get('/learners', [LearnerController::class, 'index'])->name('learners.index');
    Route::patch('/learners/{learner}/documents/{documentRequirement}', [DocumentRequirementController::class, 'update'])
        ->name('learners.documents.update');
    Route::get('/learners/{learner}', [LearnerController::class, 'show'])->name('learners.show');
    Route::get('/learners/{learner}/edit', [LearnerController::class, 'edit'])->name('learners.edit');
    Route::patch('/learners/{learner}', [LearnerController::class, 'update'])
        ->middleware('module:student_management')->name('learners.update');
    Route::patch('/learners/{learner}/disable', [LearnerController::class, 'disable'])
        ->middleware('module:student_management')->name('learners.disable');
    Route::delete('/learners/{learner}', [LearnerController::class, 'destroy'])
        ->middleware('module:student_management')->name('learners.destroy');

    Route::get('/exports/learners', [ExportController::class, 'learners'])->name('exports.learners');
    Route::get('/exports/missing-documents', [ExportController::class, 'missingDocuments'])->name('exports.missing-documents');

    Route::get('/imports', [ImportController::class, 'index'])
        ->middleware('module:document_center')
        ->name('imports.index');
    Route::post('/imports', [ImportController::class, 'store'])
        ->middleware('module:document_center')
        ->name('imports.store');

    // Registrar Module Routes
    Route::get('/admissions', [AdmissionController::class, 'index'])->name('admissions.index');
    Route::get('/admissions/create', [AdmissionController::class, 'create'])->name('admissions.create');
    Route::post('/admissions', [AdmissionController::class, 'store'])
        ->middleware('module:admission')->name('admissions.store');
    Route::patch('/admissions/{application}/status', [AdmissionController::class, 'updateStatus'])
        ->middleware('module:admission')->name('admissions.update-status');
    Route::post('/admissions/{application}/enroll', [AdmissionController::class, 'enroll'])
        ->middleware('module:admission')->name('admissions.enroll');

    Route::get('/classes', [SectionController::class, 'index'])->name('classes.index');
    Route::post('/classes', [SectionController::class, 'store'])
        ->middleware('module:class_section')->name('classes.store');
    Route::patch('/classes/{section}', [SectionController::class, 'update'])
        ->middleware('module:class_section')->name('classes.update');
    Route::get('/classes/{section}', [SectionController::class, 'show'])->name('classes.show');
    Route::post('/classes/{section}/assign', [SectionController::class, 'assign'])
        ->middleware('module:class_section')->name('classes.assign');
    Route::post('/classes/{section}/unassign', [SectionController::class, 'unassign'])
        ->middleware('module:class_section')->name('classes.unassign');

    Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
    Route::post('/attendance', [AttendanceController::class, 'store'])
        ->middleware('module:attendance')->name('attendance.store');

    Route::get('/transfers', [TransferWithdrawalController::class, 'index'])->name('transfers.index');
    Route::post('/transfers', [TransferWithdrawalController::class, 'store'])
        ->middleware('module:transfer_withdrawal')->name('transfers.store');

    Route::get('/certificates', [CertificateController::class, 'index'])->name('certificates.index');
    Route::get('/certificates/generate', [CertificateController::class, 'generate'])->name('certificates.generate');

    // Audit Trail Route
    Route::get('/audit-trail', [AuditTrailController::class, 'index'])
        ->middleware('module:audit_trail')
        ->name('audit-trail.index');

    // Teachers Directory
    Route::get('/teachers', [TeacherProfileController::class, 'index'])->name('teachers.index');

    // Finance Module Routes
    Route::get('/finance', [FinanceController::class, 'index'])->middleware('module:finance')->name('finance.index');
    Route::get('/finance/show/{enrollment}', [FinanceController::class, 'show'])->middleware('module:finance')->name('finance.show');
    Route::post('/finance/{enrollment}/charge', [FinanceController::class, 'storeCharge'])->middleware('module:finance')->name('finance.charge');
    Route::post('/finance/{enrollment}/payment', [FinanceController::class, 'storePayment'])->middleware('module:finance')->name('finance.payment');
    Route::post('/finance/{enrollment}/discount', [FinanceController::class, 'storeDiscount'])->middleware('module:finance')->name('finance.discount');
    Route::post('/finance/{enrollment}/refund', [FinanceController::class, 'storeRefund'])->middleware('module:finance')->name('finance.refund');
    Route::post('/finance/{enrollment}/installment', [FinanceController::class, 'storeInstallmentPlan'])->middleware('module:finance')->name('finance.installment');
    Route::get('/receipts/{receipt}', [FinanceController::class, 'showReceipt'])->middleware('module:finance,learner_accounts')->name('finance.receipt');
    Route::post('/receipts/{receipt}/email', [LearnerAccountController::class, 'emailReceipt'])->middleware('module:finance,learner_accounts')->name('finance.receipt.email');

    Route::get('/finance/fees', [FeeStructureController::class, 'index'])->middleware('module:finance')->name('finance.fees.index');
    Route::get('/finance/fees/create', [FeeStructureController::class, 'create'])->middleware('module:finance')->name('finance.fees.create');
    Route::post('/finance/fees', [FeeStructureController::class, 'store'])->middleware('module:finance')->name('finance.fees.store');
    Route::get('/finance/fees/{fee}/edit', [FeeStructureController::class, 'edit'])->middleware('module:finance')->name('finance.fees.edit');
    Route::patch('/finance/fees/{feeStructure}', [FeeStructureController::class, 'update'])->middleware('module:finance')->name('finance.fees.update');
    Route::delete('/finance/fees/{fee}', [FeeStructureController::class, 'destroy'])->middleware('module:finance')->name('finance.fees.destroy');
    Route::post('/finance/fees/{fee}/assign', [FeeStructureController::class, 'assign'])->middleware('module:finance')->name('finance.fees.assign');
    Route::get('/finance/fees/{fee}/learners', [FeeStructureController::class, 'getLearners'])->middleware('module:finance')->name('finance.fees.learners');

    Route::get('/finance-settings', [FinanceController::class, 'settings'])->middleware('module:finance')->name('finance.settings');
    Route::get('/batch-assessment', [FinanceController::class, 'settings'])->middleware('module:finance')->name('finance.batch-assessment');
    Route::post('/finance-settings', [FinanceController::class, 'storeSettings'])->middleware('module:finance')->name('finance.settings.store');
    Route::post('/batch-assessment', [FinanceController::class, 'storeSettings'])->middleware('module:finance')->name('finance.batch-assessment.store');
    Route::match(['put', 'patch'], '/finance-settings/{fee}', [FinanceController::class, 'updateSettings'])->middleware('module:finance')->name('finance.settings.update');
    Route::match(['put', 'patch'], '/batch-assessment/{fee}', [FinanceController::class, 'updateSettings'])->middleware('module:finance')->name('finance.batch-assessment.update');
    Route::delete('/finance-settings/{fee}', [FinanceController::class, 'destroySettings'])->middleware('module:finance')->name('finance.settings.destroy');
    Route::delete('/batch-assessment/{fee}', [FinanceController::class, 'destroySettings'])->middleware('module:finance')->name('finance.batch-assessment.destroy');
    Route::post('/finance-settings/batch-assess', [FinanceController::class, 'batchAssess'])->middleware('module:finance')->name('finance.batch-assess');
    Route::post('/batch-assessment/assess', [FinanceController::class, 'batchAssess'])->middleware('module:finance')->name('finance.batch-assessment.assess');

    // Learner Accounts Routes
    Route::get('/learner-accounts', [LearnerAccountController::class, 'index'])->middleware('module:learner_accounts')->name('learner-accounts.index');
    Route::get('/learner-accounts/{enrollment}', [LearnerAccountController::class, 'show'])->middleware('module:learner_accounts')->name('learner-accounts.show');
    Route::post('/learner-accounts/{enrollment}/discount', [LearnerAccountController::class, 'storeDiscount'])->middleware('module:learner_accounts')->name('learner-accounts.discount');
    Route::post('/learner-accounts/{enrollment}/payment', [LearnerAccountController::class, 'storePayment'])->middleware('module:learner_accounts')->name('learner-accounts.payment');
    Route::post('/learner-accounts/{enrollment}/charge', [LearnerAccountController::class, 'storeCharge'])->middleware('module:learner_accounts')->name('learner-accounts.charge');
    Route::post('/learner-accounts/{enrollment}/refund', [LearnerAccountController::class, 'storeRefund'])->middleware('module:learner_accounts')->name('learner-accounts.refund');
    Route::post('/learner-accounts/{enrollment}/assess-tuition', [LearnerAccountController::class, 'assessTuition'])->middleware('module:learner_accounts')->name('learner-accounts.assess-tuition');
    Route::post('/learner-accounts/{enrollment}/installment-plan', [LearnerAccountController::class, 'storeInstallmentPlan'])->middleware('module:learner_accounts')->name('learner-accounts.installment.store');
    Route::post('/learner-accounts/{enrollment}/installment', [LearnerAccountController::class, 'storeInstallmentPlan'])->middleware('module:learner_accounts')->name('learner-accounts.installment');
    Route::post('/learner-accounts/{enrollment}/email-statement', [LearnerAccountController::class, 'emailStatement'])->middleware('module:learner_accounts')->name('learner-accounts.email-statement');
    Route::get('/learner-accounts/{enrollment}/print-statement', [LearnerAccountController::class, 'printStatement'])->middleware('module:learner_accounts')->name('learner-accounts.print-statement');
    Route::patch('/learner-accounts/{enrollment}/update-receipt-email', [LearnerAccountController::class, 'updateReceiptEmail'])->middleware('module:learner_accounts')->name('learner-accounts.update-receipt-email');
    Route::post('/learner-accounts/{enrollment}/mark-registration-settled', [LearnerAccountController::class, 'markRegistrationSettled'])->middleware('module:learner_accounts')->name('learner-accounts.mark-registration-settled');
    Route::post('/learner-accounts/applications/{application}/settle', [LearnerAccountController::class, 'settleApplicationRegistration'])->middleware('module:learner_accounts')->name('learner-accounts.applications.settle');
    Route::get('/enrollments/{enrollment}/contract', [AdmissionController::class, 'downloadContract'])->name('enrollments.contract');
    Route::get('/enrollments/{enrollment}/contract/edit', [AdmissionController::class, 'editContract'])->name('enrollments.contract.edit');
    Route::match(['put', 'patch', 'post'], '/enrollments/{enrollment}/contract', [AdmissionController::class, 'updateContract'])->name('enrollments.contract.update');
    Route::get('/enrollments/{enrollment}/contract/preview', [AdmissionController::class, 'previewContract'])->name('enrollments.contract.preview');
    Route::post('/learner-accounts/{enrollment}/toggle-mode', [LearnerAccountController::class, 'toggleMode'])->middleware('module:learner_accounts')->name('learner-accounts.toggle-mode');
    Route::put('/learner-accounts/{enrollment}/ledgers/{ledger}', [LearnerAccountController::class, 'updateLedger'])->middleware('module:learner_accounts')->name('learner-accounts.ledgers.update');
    Route::delete('/learner-accounts/{enrollment}/ledgers/{ledger}', [LearnerAccountController::class, 'destroyLedger'])->middleware('module:learner_accounts')->name('learner-accounts.ledgers.destroy');
    Route::post('/receipts/{receipt}/email-account', [LearnerAccountController::class, 'emailReceipt'])->middleware('module:learner_accounts')->name('learner-accounts.receipt.email');
    Route::get('/installment-plans/{plan}', [LearnerAccountController::class, 'showInstallmentPlan'])->middleware('module:learner_accounts')->name('learner-accounts.installment.show');
    Route::get('/installment-plans/{plan}/print', [LearnerAccountController::class, 'printInstallmentPlan'])->middleware('module:learner_accounts')->name('learner-accounts.installment.print');
    Route::post('/installment-plans/{plan}/email', [LearnerAccountController::class, 'emailInstallmentPlan'])->middleware('module:learner_accounts')->name('learner-accounts.installment.email');

    Route::get('/academic-years', [AcademicYearController::class, 'index'])->name('academic-years.index');

    Route::get('/finance/reports', [FinanceReportController::class, 'index'])->middleware('module:finance')->name('finance.reports.index');
    Route::get('/finance/reports/export-outstanding', [FinanceReportController::class, 'exportOutstandingPdf'])->middleware('module:finance')->name('finance.reports.export-outstanding');
    Route::get('/finance/reports/export-collections', [FinanceReportController::class, 'exportCollectionsPdf'])->middleware('module:finance')->name('finance.reports.export-collections');
});

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
    Route::patch('/users/{user}/role', [UserManagementController::class, 'updateRole'])->name('users.role.update');
    Route::patch('/roles/{role}/modules/{moduleKey}', [UserManagementController::class, 'updateModulePermission'])->name('roles.modules.toggle');

    Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
    Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
    Route::post('/users/{user}/roles', [RoleController::class, 'assignUserRoles'])->name('users.roles.assign');

    Route::post('/academic-years', [AcademicYearController::class, 'store'])->name('academic-years.store');
    Route::patch('/academic-years/{academicYear}', [AcademicYearController::class, 'update'])->name('academic-years.update');
    Route::post('/academic-years/{academicYear}/activate', [AcademicYearController::class, 'activate'])->name('academic-years.activate');
    Route::delete('/academic-years/{academicYear}', [AcademicYearController::class, 'destroy'])->name('academic-years.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
