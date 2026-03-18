import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from 'src/common/logger/logger.service';
import { SocketService } from 'src/modules/socket/socket.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from './enums/booking-status.enum';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly logger: AppLoggerService,
    private readonly socketService: SocketService,
  ) {}

  async create(createBookingDto: CreateBookingDto) {
    const booking = this.bookingsRepository.create(createBookingDto);
    const savedBooking = await this.bookingsRepository.save(booking);

    this.logger.info(
      `Booking ${savedBooking.id} created for campaign ${savedBooking.campaignId}`,
      BookingsService.name,
    );

    this.socketService.emitBookingCreated({
      bookingId: savedBooking.id,
      campaignId: savedBooking.campaignId,
      influencerId: savedBooking.influencerId,
      agreedPrice: savedBooking.agreedPrice,
      status: savedBooking.status,
    });

    this.socketService.emitNotification({
      type: 'booking.created',
      message: `Booking ${savedBooking.id} was created.`,
      entityId: savedBooking.id,
    });

    return savedBooking;
  }

  async findAll() {
    return this.bookingsRepository.find({
      relations: ['campaign', 'influencer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['campaign', 'influencer'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    return booking;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto) {
    const booking = await this.findOne(id);
    Object.assign(booking, updateBookingDto);

    const updatedBooking = await this.bookingsRepository.save(booking);

    this.logger.info(
      `Booking ${updatedBooking.id} updated successfully.`,
      BookingsService.name,
    );

    await this.emitBookingUpdated(updatedBooking.id);
    return updatedBooking;
  }

  async updateStatus(id: string, status: BookingStatus) {
    const booking = await this.findOne(id);
    booking.status = status;

    const updatedBooking = await this.bookingsRepository.save(booking);

    this.logger.info(
      `Booking ${updatedBooking.id} status changed to ${status}.`,
      BookingsService.name,
    );

    await this.emitBookingUpdated(updatedBooking.id);
    return updatedBooking;
  }

  async emitBookingUpdated(bookingId: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      relations: ['campaign', 'influencer'],
    });

    if (!booking) {
      return null;
    }

    this.socketService.emitBookingUpdated({
      bookingId: booking.id,
      campaignId: booking.campaignId,
      influencerId: booking.influencerId,
      agreedPrice: booking.agreedPrice,
      status: booking.status,
    });

    this.socketService.emitNotification({
      type: 'booking.updated',
      message: `Booking ${booking.id} was updated.`,
      entityId: booking.id,
    });

    this.logger.info(
      `Booking ${booking.id} update event emitted.`,
      BookingsService.name,
    );

    return booking;
  }
}
