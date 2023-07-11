import { Injectable } from "@angular/core";
import { HttpInterceptor, HttpHandler, HttpEvent, HttpHeaders, HttpResponse } from "@angular/common/http";
// import { userService } from '../../services/user-service.service';
import { HttpRequest } from '@angular/common/http';
import { Observable } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { tap } from "rxjs/operators";
import { error } from "protractor";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
constructor(private toastr:ToastrService){}
    intercept(req: HttpRequest<any>,
              next: HttpHandler): Observable<HttpEvent<any>> {

        const idToken = localStorage.getItem("id_token");

        if (idToken) {
            const cloned = req.clone({
              headers: new HttpHeaders({
                  Authorization: "Bearer " + idToken,
          "Content-Type": "application/json"
              })
            })

            return next.handle(cloned).pipe(

                 tap((response:HttpResponse<any>)=>{

                    switch(response.status){

                        case 201:
                            this.toastr.success(null, 'Data saved successfully');
                        break;
                        
                            case 200:

                            switch(req.method){

                               
                                
                                    case 'DELETE':
                                        this.toastr.success(null, 'Data Deleted successfully');
                                        break;
                                    

                                        case 'PUT':
                                            this.toastr.success(null, 'Data updated successfully');
                                            break;
            
                                    default:
                                      //  this.toastr.clear()
                                      break;
                            }
                            default:
                                    break;

                    }
                    // if (response.status===200 && req.method != 'GET' && !response.url.endsWith('query')){
                    //     this.toastr.success(null, response.body.success);
                        
                    // }
                

                 })

            )
        }
        else {
            return next.handle(req);
        }
    }
}