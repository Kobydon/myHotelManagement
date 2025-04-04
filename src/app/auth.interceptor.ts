import { Injectable } from "@angular/core";
import { HttpInterceptor, HttpHandler, HttpEvent, HttpRequest, HttpHeaders, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { tap, catchError } from "rxjs/operators";
import { of } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private toastr: ToastrService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const idToken = localStorage.getItem("id_token");

    if (!idToken) {
      this.router.navigate(['/login']);
      return next.handle(req); // Exit early if no token is found
    }

    const cloned = req.clone({
      headers: new HttpHeaders({
        Authorization: "Bearer " + idToken,
        'Content-Type': 'application/json'
      })
    });

    return next.handle(cloned).pipe(
      tap((response: HttpResponse<any>) => {
        switch (response.status) {
          case 201:
            this.toastr.success(null, 'Data saved successfully');
            break;
          case 200:
            switch (req.method) {
              case 'DELETE':
                this.toastr.success(null, 'Data deleted successfully');
                break;
              case 'PUT':
                this.toastr.success(null, 'Data updated successfully');
                break;
              default:
                break;
            }
            break;
          default:
            break;
        }
      }),
      catchError((error) => {
        if (error.status === 401) {
          this.toastr.error('You are not authorized');
          this.router.navigate(['/login']); // Redirect to login if unauthorized
        } else if (error.status === 500) {
          this.toastr.error('Server error, please try again later');
        } else {
          this.toastr.error('An error occurred, please try again');
        }
        return of(error);
      })
    );
  }
}
