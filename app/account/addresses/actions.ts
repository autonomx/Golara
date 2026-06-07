'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { addCustomerAddress, deleteCustomerAddress, setDefaultCustomerAddress, updateCustomerAddress } from '@/lib/customers/customer-repository';
import { hasDatabase } from '@/lib/prisma';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function boolField(formData: FormData, name: string) {
  return formData.get(name) === 'on' || formData.get(name) === 'true';
}

function addressPath(status: string) {
  return `/account/addresses?status=${encodeURIComponent(status)}`;
}

async function requireCustomerId() {
  if (!hasDatabase()) redirect(addressPath('database-required'));
  const token = await getCustomerSessionCookie();
  const session = await getCustomerSession(token);
  if (!session) redirect('/account?status=session-required');
  return session.customerId;
}

function addressInput(formData: FormData) {
  return {
    label: stringField(formData, 'label'),
    recipient: stringField(formData, 'recipient'),
    phone: stringField(formData, 'phone'),
    city: stringField(formData, 'city'),
    line1: stringField(formData, 'line1'),
    line2: stringField(formData, 'line2'),
    notes: stringField(formData, 'notes'),
    isDefault: boolField(formData, 'isDefault')
  };
}

export async function addAccountAddressAction(formData: FormData) {
  const customerId = await requireCustomerId();
  let redirectTarget = '';
  try {
    await addCustomerAddress(customerId, addressInput(formData));
    revalidatePath('/account');
    revalidatePath('/account/addresses');
    redirectTarget = addressPath('added');
  } catch (error) {
    console.warn('[account] failed to add address', error);
    redirectTarget = addressPath('failed');
  }
  redirect(redirectTarget);
}

export async function updateAccountAddressAction(formData: FormData) {
  const customerId = await requireCustomerId();
  let redirectTarget = '';
  try {
    await updateCustomerAddress(customerId, stringField(formData, 'addressId'), addressInput(formData));
    revalidatePath('/account');
    revalidatePath('/account/addresses');
    redirectTarget = addressPath('updated');
  } catch (error) {
    console.warn('[account] failed to update address', error);
    redirectTarget = addressPath('failed');
  }
  redirect(redirectTarget);
}

export async function setDefaultAccountAddressAction(formData: FormData) {
  const customerId = await requireCustomerId();
  let redirectTarget = '';
  try {
    await setDefaultCustomerAddress(customerId, stringField(formData, 'addressId'));
    revalidatePath('/account');
    revalidatePath('/account/addresses');
    redirectTarget = addressPath('default-updated');
  } catch (error) {
    console.warn('[account] failed to set default address', error);
    redirectTarget = addressPath('failed');
  }
  redirect(redirectTarget);
}

export async function deleteAccountAddressAction(formData: FormData) {
  const customerId = await requireCustomerId();
  let redirectTarget = '';
  try {
    await deleteCustomerAddress(customerId, stringField(formData, 'addressId'));
    revalidatePath('/account');
    revalidatePath('/account/addresses');
    redirectTarget = addressPath('deleted');
  } catch (error) {
    console.warn('[account] failed to delete address', error);
    redirectTarget = addressPath('failed');
  }
  redirect(redirectTarget);
}
