import { AuthError } from 'next-auth';
import { User } from "next-auth"
import { signIn } from '../../auth';


export class SessionUser implements User {
    _id: string;
    name: string;
    email: string;

    constructor(role: string, group: string) {
        // Get token and role
        this._id = ""

        // Abuse name and email for simplicity for "role" and "group"
        this.name = role
        this.email = group
    }
}

export async function get_role_and_group(pwd: string): Promise<{role: string, group: string} | null> {
    // TODO: Use Hashed pwd in frontend and backend 

  let response = await fetch(`http://localhost:3001/api/get_group_and_role`, {
    method:"POST",
    body: JSON.stringify({"pwd": pwd})
    }
  )
  if (response.ok) {
    let data = await response.json()

    return {
       role: data.role, 
       group: data.group
     }
  }else {
    return null
  }


}


export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    formData.append("redirect", "false");
    try {
      await signIn('credentials', formData);
    } catch (error) {
      return 'Invalid credentials.';
    }
  } 