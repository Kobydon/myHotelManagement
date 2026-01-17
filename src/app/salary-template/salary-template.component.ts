import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { EmployeeService } from 'app/services/employee.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'salary-template',
  templateUrl: './salary-template.component.html',
  styleUrls: ['./salary-template.component.css']
})
export class SalaryTemplateComponent implements OnInit {

  salaryForm!: FormGroup;
  salaryTemplates: any[] = [];
  editingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSalaryTemplates();
  }

  initForm() {
    this.salaryForm = this.fb.group({
      name: ['', Validators.required],
      position: ['', Validators.required],
      earnings: this.fb.array([]),
      deductions: this.fb.array([])
    });

    this.addEarning();
    this.addDeduction();
  }

  /* ===== Earnings ===== */
  get earnings(): FormArray {
    return this.salaryForm.get('earnings') as FormArray;
  }

  addEarning() {
    this.earnings.push(
      this.fb.group({
        label: ['', Validators.required],
        amount: [0, Validators.required]
      })
    );
  }

  removeEarning(index: number) {
    this.earnings.removeAt(index);
  }

  /* ===== Deductions ===== */
  get deductions(): FormArray {
    return this.salaryForm.get('deductions') as FormArray;
  }

  addDeduction() {
    this.deductions.push(
      this.fb.group({
        label: ['', Validators.required],
        amount: [0, Validators.required]
      })
    );
  }

  removeDeduction(index: number) {
    this.deductions.removeAt(index);
  }

  /* ===== CRUD ===== */

  loadSalaryTemplates() {
    this.employeeService.getSalaryTemplates()
      .subscribe(res => this.salaryTemplates = res);
  }

  editTemplate(id: number) {
    this.editingId = id;
    this.earnings.clear();
    this.deductions.clear();

    this.employeeService.getSalaryTemplate(id)
      .subscribe(data => {
        this.salaryForm.patchValue({
          name: data.name,
          position: data.position
        });

        data.earnings.forEach((e: any) =>
          this.earnings.push(this.fb.group(e))
        );

        data.deductions.forEach((d: any) =>
          this.deductions.push(this.fb.group(d))
        );
      });
  }

  submit() {
    if (this.salaryForm.invalid) {
      this.toastr.error('Please fill all required fields');
      return;
    }

    if (this.editingId) {
      this.employeeService.updateSalaryTemplate(
        this.editingId,
        this.salaryForm.value
      ).subscribe(() => {
        this.toastr.success('Salary template updated');
        this.resetForm();
      });
    } else {
      this.employeeService.createSalaryTemplate(
        this.salaryForm.value
      ).subscribe(() => {
        this.toastr.success('Salary template created');
        this.resetForm();
      });
    }
  }

  deleteTemplate(id: number) {
    if (!confirm('Delete this salary template?')) return;

    this.employeeService.deleteSalaryTemplate(id)
      .subscribe(() => {
        this.toastr.success('Salary template deleted');
        this.loadSalaryTemplates();
      });
  }

  resetForm() {
    this.salaryForm.reset();
    this.earnings.clear();
    this.deductions.clear();
    this.addEarning();
    this.addDeduction();
    this.editingId = null;
    this.loadSalaryTemplates();
  }


  
}
