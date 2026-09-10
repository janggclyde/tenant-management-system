export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Tenant, User, Contract, Unit, Building, Notification, syncDatabase } from '@/db/models';
import { getTenantFromRequest } from '@/lib/tenantAuth';
import bcrypt from 'bcrypt';

export async function GET(request: NextRequest) {
  try {
    await syncDatabase();
    const session = await getTenantFromRequest(request);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Tenant profile not found' }, { status: 404 });
    }

    const tRecord: any = await Tenant.findOne({
      where: { id: session.tenantId },
      include: [
        { model: User },
        {
          model: Contract,
          include: [{ model: Unit, include: [{ model: Building }] }]
        }
      ]
    });

    const plain = tRecord ? tRecord.get({ plain: true }) : session.tenant;
    const personalInfo = plain.personal_info_json || {};

    let emergencyContact: any = null;
    if (plain.emergency_contact) {
      if (typeof plain.emergency_contact === 'string') {
        try {
          const parsed = JSON.parse(plain.emergency_contact);
          if (typeof parsed === 'object' && parsed !== null) {
            emergencyContact = {
              name: parsed.name || '',
              phone: parsed.phone || '',
              relationship: parsed.relationship || 'Emergency Contact'
            };
          } else if (typeof parsed === 'number' || /^\+?\d+$/.test(String(parsed).trim())) {
            emergencyContact = {
              name: 'Emergency Contact',
              phone: String(parsed).trim(),
              relationship: 'Contact'
            };
          }
        } catch (e) {
          const raw = String(plain.emergency_contact).trim();
          if (/^(\+?\d[\d\s-]{6,15})$/.test(raw)) {
            emergencyContact = { name: 'Emergency Contact', phone: raw, relationship: 'Contact' };
          } else {
            emergencyContact = { name: raw, phone: '', relationship: 'Contact' };
          }
        }
      } else if (typeof plain.emergency_contact === 'object' && plain.emergency_contact !== null) {
        emergencyContact = {
          name: plain.emergency_contact.name || '',
          phone: plain.emergency_contact.phone || '',
          relationship: plain.emergency_contact.relationship || 'Emergency Contact'
        };
      }
    }

    const contracts = plain.Contracts || [];
    const latestContract = contracts.length > 0 ? contracts[contracts.length - 1] : null;
    const unit = latestContract?.Unit || null;
    const building = unit?.Building || null;

    return NextResponse.json({
      success: true,
      profile: {
        id: plain.id,
        name: session.tenantName,
        first_name: personalInfo.first_name || '',
        last_name: personalInfo.last_name || '',
        email: session.tenantEmail || plain.User?.email || '',
        phone: personalInfo.phone || '',
        address: personalInfo.address || '',
        id_type: personalInfo.id_type || null,
        id_number: personalInfo.id_number || null,
        emergency_contact: emergencyContact,
        unit: {
          id: unit?.id || session.unitId,
          unit_number: unit?.unit_number || session.unitNumber,
          monthly_rent: unit?.monthly_rent ? Number(unit.monthly_rent) : session.monthlyRent,
          status: unit?.status || 'occupied'
        },
        building: {
          id: building?.id || session.buildingId,
          name: building?.name || session.buildingName,
          address: building?.address || session.buildingAddress
        },
        lease: {
          move_in_date: latestContract?.move_in_date || session.moveInDate,
          move_out_date: latestContract?.move_out_date || session.moveOutDate,
          document_url: latestContract?.document_url || session.documentUrl
        }
      }
    });

  } catch (err: any) {
    console.error('Tenant profile GET error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await syncDatabase();
    const session = await getTenantFromRequest(request);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized or profile not found' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      first_name, 
      last_name, 
      phone, 
      address, 
      emergency_contact, 
      current_password, 
      new_password, 
      password 
    } = body;

    const tenantRecord: any = await Tenant.findOne({
      where: { id: session.tenantId },
      include: [{ model: User }]
    });

    if (!tenantRecord) {
      return NextResponse.json({ success: false, error: 'Tenant record not found' }, { status: 404 });
    }

    // Handle Password Update if requested
    const targetPassword = new_password || password;
    if (targetPassword && targetPassword.trim()) {
      if (targetPassword.trim().length < 6) {
        return NextResponse.json({ 
          success: false, 
          error: 'New password must be at least 6 characters.' 
        }, { status: 400 });
      }

      const userRecord: any = await User.findByPk(tenantRecord.user_id);
      if (!userRecord) {
        return NextResponse.json({ success: false, error: 'User account not found' }, { status: 404 });
      }

      // If user supplied current password, verify it
      if (current_password && current_password.trim()) {
        const isMatch = await bcrypt.compare(current_password.trim(), userRecord.password_hash);
        if (!isMatch) {
          return NextResponse.json({ 
            success: false, 
            error: 'Current password does not match.' 
          }, { status: 400 });
        }
      }

      const hash = await bcrypt.hash(targetPassword.trim(), 10);
      await userRecord.update({ password_hash: hash });
    }

    // Update Personal Details
    const currentInfo = tenantRecord.personal_info_json || {};
    const updatedInfo = {
      ...currentInfo,
      first_name: first_name !== undefined ? String(first_name).trim() : currentInfo.first_name,
      last_name: last_name !== undefined ? String(last_name).trim() : currentInfo.last_name,
      phone: phone !== undefined ? String(phone).trim() : currentInfo.phone,
      address: address !== undefined ? String(address).trim() : currentInfo.address
    };

    let updatedEmergency = tenantRecord.emergency_contact;
    if (emergency_contact !== undefined) {
      if (typeof emergency_contact === 'object') {
        updatedEmergency = JSON.stringify(emergency_contact);
      } else {
        updatedEmergency = String(emergency_contact);
      }
    }

    await tenantRecord.update({
      personal_info_json: updatedInfo,
      emergency_contact: updatedEmergency
    });

    // Notify resident of update
    try {
      await Notification.create({
        user_id: session.userId,
        type: 'profile_update',
        message: 'Your resident profile details and security settings have been updated.',
        is_read: false
      });
    } catch (notifErr) {}

    return NextResponse.json({
      success: true,
      message: 'Profile and password updated successfully!',
      profile: {
        first_name: updatedInfo.first_name,
        last_name: updatedInfo.last_name,
        phone: updatedInfo.phone,
        address: updatedInfo.address,
        emergency_contact: typeof updatedEmergency === 'string' ? JSON.parse(updatedEmergency) : updatedEmergency
      }
    });

  } catch (err: any) {
    console.error('Tenant profile PUT error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}
