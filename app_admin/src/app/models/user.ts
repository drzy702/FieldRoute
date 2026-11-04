export class User {
    email: string; 
    name: string;
    role?: 'admin' | 'customer';
    _id?: string;
 
    constructor() 
    { 
        this.email = ''; 
        this.name = ''; 
    }
}
