import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeService } from 'app/services/employee.service';
import { ToastrService } from 'ngx-toastr';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'salary-payment',
  templateUrl: './salary-payment.component.html',
  styleUrls: ['./salary-payment.component.css']
})
export class SalaryPaymentComponent implements OnInit {

  form!: FormGroup;
  templates: any[] = [];
  history: any[] = [];
  selectedTemplate: any;
  dateSelected: string = '';
  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      template_id: ['', Validators.required],
      session: ['', Validators.required],
      payment_method: ['cash', Validators.required]
    });

    this.loadTemplates();
    this.loadHistory();
  }

  loadTemplates() {
    this.employeeService.getSalaryTemplates()
      .subscribe(res => this.templates = res);
  }

  onTemplateChange() {
    this.selectedTemplate = this.templates.find(
      t => t.id == this.form.value.template_id
    );
  }

  gross() {
    return this.selectedTemplate
      ? this.selectedTemplate.earnings.reduce((a: number, b: any) => a + Number(b.amount), 0)
      : 0;
  }

  deductions() {
    return this.selectedTemplate
      ? this.selectedTemplate.deductions.reduce((a: number, b: any) => a + Number(b.amount), 0)
      : 0;
  }

  net() {
    return this.gross() - this.deductions();
  }

  submit() {
    if (this.form.invalid) return;

    this.employeeService.bulkPaySalary(this.form.value)
      .subscribe(res => {
        this.toastr.success('Employees paid successfully');
        this.loadHistory();
      });
  }

  loadHistory() {
    this.employeeService.getSalaryPaymentHistory()
      .subscribe(res => this.history = res);
  }
 filterByDate() {
  if (!this.dateSelected) {
    this.loadHistory();
    return;
  }

  const selectedDate = new Date(this.dateSelected);

  this.employeeService.getSalaryPaymentHistory()
    .subscribe(res => {
      this.history = res.filter(item => {

        // ✅ FIX: correct field name
        const paymentDate = new Date(item.payment_date);

        // ✅ Compare date-only (ignore time)
        return (
          paymentDate.getFullYear() === selectedDate.getFullYear() &&
          paymentDate.getMonth() === selectedDate.getMonth() &&
          paymentDate.getDate() === selectedDate.getDate()
        );
      });
    });
}


printToPdf() {
  const printArea = document.getElementById("pdf");
  const printWindow = window.open('', 'PRINT', 'height=800,width=600');

  if (!printArea || !printWindow) {
    console.error("Print area or print window not found.");
    return;
  }

  const styles = `
    <style>
      body, h1, h2, h3, p, table, th, td {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        font-size: 12px; /* Adjusted font size for readability */
      }
      .container {
        max-width: 100%;
        margin: 0;
        padding: 10px;
        background: #fff;
        border-radius: 4px;
        box-shadow: none;
      }
      .header {
        text-align: center;
        margin-bottom: 10px;
      }
      .header h2 {
        color: #333;
        font-size: 16px;
      }
      .header p {
        color: #666;
        font-size: 12px;
      }
      .report-details h3 {
        color: #333;
        font-size: 14px;
        border-bottom: 1px solid #ddd;
        margin-bottom: 5px;
        padding-bottom: 5px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
      }
      table, th, td {
        border: 1px solid #ddd;
      }
      th, td {
        padding: 8px;
        text-align: left;
        font-size: 12px;
      }
      th {
        background-color: #f4f4f4;
      }
      td {
        background-color: #fff;
      }
      tr:nth-child(even) td {
        background-color: #f9f9f9;
      }
      .footer {
        text-align: center;
        margin-top: 10px;
        color: #666;
        font-size: 12px;
      }
      @media print {
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          margin: 0;
        }
        .container {
          max-width: 100%;
          page-break-inside: avoid;
        }
      }
    </style>
  `;

  printWindow.document.write(`
    <html>
      <head>
        ${styles}
      </head>
      <body>
        ${printArea.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

downloadPdf() {
  const printArea = document.getElementById("pdf");

  if (!printArea) {
    console.error("Print area not found.");
    return;
  }

  html2canvas(printArea, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait mode, millimeters, A4 size

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('salary_report.pdf');
  });
}

exportExcel() {
  if (!this.history || this.history.length === 0) {
    return;
  }

  const excelData = this.history.map(item => ({
    Employee: item.employee_name,
    Position: item.position,
    'Net Salary': item.net_salary,
    'Payment Method': item.payment_method,
    Session: item.session,
    Date: new Date(item.payment_date).toLocaleDateString()
  }));

  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
  const workbook: XLSX.WorkBook = {
    Sheets: { 'Salary Payments': worksheet },
    SheetNames: ['Salary Payments']
  };

  const excelBuffer: any = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });

  this.saveExcelFile(excelBuffer, 'Salary_Payment_History');
}
saveExcelFile(buffer: any, fileName: string): void {
  const data: Blob = new Blob([buffer], {
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  });

  FileSaver.saveAs(
    data,
    `${fileName}_${new Date().getTime()}.xlsx`
  );
}


}
