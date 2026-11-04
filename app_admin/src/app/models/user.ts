export class User {
    email: string; 
    name: string;
    role?: 'admin' | 'customer';
 
    constructor() 
    { 
        this.email = ''; 
        this.name = ''; 
    }
}
