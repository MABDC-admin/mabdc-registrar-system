#!/bin/bash

# Clean up any bad models that might have generated during the failure
rm -f app/Models/Attendance.php
rm -f app/Models/StudentId.php
rm -f app/Models/HealthRecord.php
rm -f app/Models/Behavior.php
rm -f app/Models/Promotion.php
rm -f app/Models/Fee.php
rm -f app/Models/Communication.php

# Create models and migrations
php artisan make:model Attendance -m
php artisan make:model StudentId -m
php artisan make:model HealthRecord -m
php artisan make:model Behavior -m
php artisan make:model Promotion -m
php artisan make:model Fee -m
php artisan make:model Communication -m

# Modify Models to add $guarded = [] and Learner relationship
for model in Attendance StudentId HealthRecord Behavior Promotion Fee Communication; do
    sed -i 's/use HasFactory;/use HasFactory;\n    protected $guarded = [];\n\n    public function learner()\n    {\n        return $this->belongsTo(Learner::class);\n    }/' app/Models/$model.php
done

# We will handle migrations via sed matching the exact table names
# Attendance
MIG=$(ls database/migrations/*_create_attendances_table.php)
sed -i 's/$table->id();/$table->id();\n            $table->foreignId("learner_id")->constrained()->cascadeOnDelete();\n            $table->date("date");\n            $table->enum("status", ["present", "absent", "late"]);\n            $table->text("remarks")->nullable();/' $MIG

# StudentId
MIG=$(ls database/migrations/*_create_student_ids_table.php)
sed -i 's/$table->id();/$table->id();\n            $table->foreignId("learner_id")->constrained()->cascadeOnDelete();\n            $table->string("qr_code")->unique();\n            $table->date("issued_date");\n            $table->date("expiry_date");\n            $table->enum("status", ["active", "revoked"])->default("active");/' $MIG

# HealthRecord
MIG=$(ls database/migrations/*_create_health_records_table.php)
sed -i 's/$table->id();/$table->id();\n            $table->foreignId("learner_id")->constrained()->cascadeOnDelete();\n            $table->string("blood_type")->nullable();\n            $table->text("allergies")->nullable();\n            $table->text("medical_conditions")->nullable();\n            $table->text("emergency_contact")->nullable();/' $MIG

# Behavior
MIG=$(ls database/migrations/*_create_behaviors_table.php)
sed -i 's/$table->id();/$table->id();\n            $table->foreignId("learner_id")->constrained()->cascadeOnDelete();\n            $table->date("incident_date");\n            $table->string("type");\n            $table->text("description");\n            $table->enum("severity", ["low", "medium", "high"]);\n            $table->string("action_taken")->nullable();/' $MIG

# Promotion
MIG=$(ls database/migrations/*_create_promotions_table.php)
sed -i 's/$table->id();/$table->id();\n            $table->foreignId("learner_id")->constrained()->cascadeOnDelete();\n            $table->string("from_grade");\n            $table->string("to_grade");\n            $table->string("academic_year");\n            $table->enum("status", ["promoted", "retained", "transferred"]);\n            $table->text("remarks")->nullable();/' $MIG

# Fee
MIG=$(ls database/migrations/*_create_fees_table.php)
sed -i 's/$table->id();/$table->id();\n            $table->foreignId("learner_id")->constrained()->cascadeOnDelete();\n            $table->string("type");\n            $table->decimal("amount", 10, 2);\n            $table->date("due_date");\n            $table->enum("status", ["pending", "partial", "paid"])->default("pending");/' $MIG

# Communication
MIG=$(ls database/migrations/*_create_communications_table.php)
sed -i 's/$table->id();/$table->id();\n            $table->foreignId("learner_id")->nullable()->constrained()->cascadeOnDelete();\n            $table->string("type");\n            $table->string("subject");\n            $table->text("message");\n            $table->enum("status", ["draft", "sent", "failed"])->default("draft");\n            $table->timestamp("sent_at")->nullable();/' $MIG

php artisan migrate
