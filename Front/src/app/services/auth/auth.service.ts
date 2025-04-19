import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { DatabaseService } from '../database/database.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;
  user = signal<User | null>(null);
  router = inject(Router);

  constructor(private db: DatabaseService) {
    this.supabase = this.db.client;

    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session === null) {
        this.user.set(null);
        this.router.navigateByUrl('/home');
        return;
      }

      this.supabase.auth.getUser().then(({ data, error }) => {
        this.user.set(data.user);
        this.router.navigateByUrl('/home');
      });
    });
  }

  // async register(email: string, password: string): Promise<{ success: boolean; message: string }> {
  //   const { data, error } = await this.supabase.auth.signUp({
  //     email: email,
  //     password: password,
  //   });

  //   if (error) {
  //     return { success: false, message: error.message };
  //   }

  //   return { success: true, message: 'Registro exitoso. Revisa tu correo para confirmar.' };
  // }

  async register(
    email: string,
    password: string,
    extraData: { firstName: string; lastName: string; age: number }
  ): Promise<{ success: boolean; message: string }> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return { success: false, message: error.message };
    }

    const user = data.user;
    console.log(user);

    if (!user) {
      return { success: false, message: 'No se pudo obtener el usuario después del registro.' };
    }

    const { error: insertError } = await this.supabase.from('usuarios').insert([
      {
        id: user.id, // casteamos UUID como número hexadecimal a bigint
        nombre: extraData.firstName,
        apellido: extraData.lastName,
        edad: extraData.age // casteamos a int
      }
    ]);

    if (insertError) {
      console.log(insertError);
      return { success: false, message: 'Registro fallido al guardar los datos.' };
    }

    return {
      success: true,
      message: 'Registro exitoso. Verifica tu correo para confirmar tu cuenta.'
    };
  }


  async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return { success: false, message: 'Credenciales invalidas.' };
    }

    return { success: true, message: 'Inicio de sesión exitoso.' };
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Sesión cerrada correctamente.' };
  }
}

