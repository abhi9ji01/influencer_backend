import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Campaign } from 'src/modules/campaigns/entities/campaign.entity';
import { Influencer } from 'src/modules/influencers/entities/influencer.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  firstName!: string;

  @Column({ length: 120 })
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isVerified!: boolean;

  @OneToOne(() => Influencer, (influencer) => influencer.user)
  influencerProfile?: Influencer;

  @OneToMany(() => Campaign, (campaign) => campaign.customer)
  campaigns!: Campaign[];

  @OneToMany(() => Review, (review) => review.customer)
  reviews!: Review[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (!this.password || this.isPasswordHashed(this.password)) {
      return;
    }

    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(this.password, salt, 64).toString('hex');
    this.password = `${salt}:${hash}`;
  }

  async validatePassword(password: string): Promise<boolean> {
    const [salt, storedHash] = this.password.split(':');

    if (!salt || !storedHash) {
      return false;
    }

    const hashBuffer = scryptSync(password, salt, 64);
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    if (hashBuffer.length !== storedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(hashBuffer, storedHashBuffer);
  }

  private isPasswordHashed(value: string): boolean {
    return /^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(value);
  }
}
