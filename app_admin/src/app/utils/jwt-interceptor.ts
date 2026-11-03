// import { Injectable,Provider } from '@angular/core'; 
// import { HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
// import { HttpInterceptorFn } from '@angular/common/http';
// import { Observable } from 'rxjs'; 
// import { Authentication } from '../services/authentication'; 

// @Injectable()
// export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
//   return next(req);
// };


import { Injectable,Provider } from '@angular/core'; 
import { HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http'; 
import { HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http'; 
import { Observable } from 'rxjs'; 
import { Authentication } from '../services/authentication';

@Injectable() 
export class JwtInterceptor implements HttpInterceptor {
  constructor( 
  private authenticationService: Authentication 
) {}
intercept(request: HttpRequest<any>, next: HttpHandler):  
Observable<HttpEvent<any>> { 
var isAuthAPI: boolean; 
    // console.log('Interceptor::URL' + request.url); 
    if(request.url.startsWith('login') ||  
        request.url.startsWith('register')) { 
      isAuthAPI = true; 
    } 
    else { 
      isAuthAPI = false; 
    } 
 
    if(this.authenticationService.isLoggedIn() && !isAuthAPI) { 
      let token = this.authenticationService.getToken(); 
      // console.log(token); 
      const authReq = request.clone({ 
        setHeaders: { 
          Authorization: `Bearer ${token}` 
        } 
      }); 
      return next.handle(authReq); 
    } 
    return next.handle(request); 
  } 
  
} 

export const authInterceptProvider: Provider =  
  { provide: HTTP_INTERCEPTORS,  
      useClass: JwtInterceptor, multi: true };