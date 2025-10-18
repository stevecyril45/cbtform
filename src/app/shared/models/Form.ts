import { Validators } from '@angular/forms';


interface Option {
  value: string | number ,
  text:string
}
export interface Form{
  default: any,
  validations:Validators[]
  tag: 'input'|'select'|'textarea'|'file' | 'radio',
  type: 'text'| 'number' | 'email' | 'radio' | 'password' | 'checkbox',
  required: boolean,
  status: boolean,
  id:string,
  options?: Option[],
  upload?: Function,
}
