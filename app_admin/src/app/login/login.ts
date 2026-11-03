import { Component, OnInit } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { FormsModule } from "@angular/forms"; 
import { Router } from '@angular/router'; 
import { Authentication } from '../services/authentication';
import { User } from '../models/user';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})

export class Login {

   public formError: string = ''; 
  submitted = false; 
 
  credentials = { 
    name: '', 
    email: '', 
    password: '' 
  }

  constructor( 
    private router: Router, 
    private authenticationService: Authentication
  ) { } 
 
  ngOnInit(): void { 
  } 

  public onLoginSubmit(): void { 
    this.formError = ''; 
    if (!this.credentials.email || !this.credentials.password) { 
      this.formError = 'All fields are required, please try again';
      return;
    } 
      this.doLogin(); 
  }

  // private doLogin(): void { 
  //   let newUser = { 
  //     name: this.credentials.name, 
  //     email: this.credentials.email 
  //   } as User; 
 
  //   // console.log('LoginComponent::doLogin'); 
  //   // console.log(this.credentials); 

  //   this.authenticationService.login(newUser, 
  //   this.credentials.password); 
 
  //   if(this.authenticationService.isLoggedIn()) 
  //   { 
  //     // console.log('Router::Direct'); 
  //     this.router.navigate(['']); 
  //   } else { 
  //     var timer = setTimeout(() => { 
  //     if(this.authenticationService.isLoggedIn()) 
  //     { 
  //       // console.log('Router::Pause'); 
  //       this.router.navigate(['']); 
  //     }},3000); 
  //   } 
  // } 

  // Runs when user clicks "Sign In"
private doLogin(): void {

  // Create user object with email only (no name needed for login)
  const newUser = {
    email: this.credentials.email
  } as User;

  // Call login and wait for response
  this.authenticationService.login(newUser, this.credentials.password)
    .subscribe({
      next: (value: any) => {
        // If login is successful, save the token
        this.authenticationService.saveToken(value.token);

        // Redirect to admin/dashboard page
        this.router.navigate(['']);
      },
      error: (err) => {
        // If login fails, show error message on screen
        this.formError = err.error?.message || 'Invalid email or password';
      }
    });
}

}
