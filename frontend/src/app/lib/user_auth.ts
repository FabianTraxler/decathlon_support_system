import { AuthError } from 'next-auth';
import { User } from "next-auth"
import { signIn } from '../../auth';


export class SessionUser implements User {
    _id: string;
    name: string;
    email: string

    constructor(pwd: string) {
        // Get token and role
        this._id = ""

        let role = get_role(pwd)
        // Abuse name and email for simplicity for "role" and "group"
        this.name = role.role
        this.email = role.group
    }
}

function get_role(pwd: string): {role: string, group: string} {
  // TODO: Change to get role and group info from backend
  let role = ""
  let info = ""
  if (pwd.includes("Gruppe") || pwd.includes("U")){
    role = "group" 
    info = pwd
  } else {
    role = pwd 
    info = pwd
  }

  return {
    role: role, 
    group: info
  }
}


export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  } 