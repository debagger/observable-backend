import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UploadedImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ip: string;

  @Column()
  date: Date;

  @Column({nullable: true})
  lastAccessDate?: Date;

  @Column()
  size:number;

  @Column({nullable: true})
  filename?:string;

  
}