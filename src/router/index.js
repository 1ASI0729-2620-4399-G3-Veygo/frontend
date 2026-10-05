import {createRouter, createWebHistory} from 'vue-router';
import {iamStore} from '@/iam/application/iam.store.js';
import {UserRole} from '@/iam/domain/model/user-role.js';
import Layout from '@/shared/presentation/components/layout.vue';

// Lazy-loaded views, grouped by bounded context.
const SignIn = () => import('@/iam/presentation/views/sign-in.vue');
const SignUp = () => import('@/iam/presentation/views/sign-up.vue');
const RenterHome = () => import('@/dashboard/presentation/views/renter-home.vue');
const OwnerHome = () => import('@/dashboard/presentation/views/owner-home.vue');
const VehicleSearch = () => import('@/fleet/presentation/views/vehicle-search.vue');
const VehicleDetail = () => import('@/fleet/presentation/views/vehicle-detail.vue');
const OwnerVehicles = () => import('@/fleet/presentation/views/owner-vehicles.vue');
const VehicleForm = () => import('@/fleet/presentation/views/vehicle-form.vue');
const BookingConfirmation = () => import('@/booking/presentation/views/booking-confirmation.vue');
const RenterBookings = () => import('@/booking/presentation/views/renter-bookings.vue');
const OwnerBookings = () => import('@/booking/presentation/views/owner-bookings.vue');
const FavoriteVehicles = () => import('@/engagement/presentation/views/favorite-vehicles.vue');
const TermsAndConditions = () => import('@/shared/presentation/views/terms-and-conditions.vue');
const PageNotFound = () => import('@/shared/presentation/views/page-not-found.vue');
const Messages = () => import('@/communication/presentation/views/messages.vue');
const Profile = () => import('@/iam/presentation/views/profile.vue');
const OwnerVehicleDetail = () => import('@/fleet/presentation/views/owner-vehicle-detail.vue');
const VehicleAvailability = () => import('@/fleet/presentation/views/vehicle-availability.vue');
const OwnerTransactions = () => import('@/payment/presentation/views/owner-transactions.vue');
const OwnerRatings = () => import('@/reputation/presentation/views/owner-ratings.vue');

/**
 * Returns the home route of a signed-in user according to the role.
 *
 * @param {import('@/iam/domain/model/user.entity.js').User|null} user - The current user.
 * @returns {{name: string}}
 */
export const homeRouteFor = user => ({name: user?.isOwner() ? 'owner-home' : 'renter-home'});

const routes = [
  {path: '/sign-in', name: 'sign-in', component: SignIn, meta: {title: 'sign-in', public: true}},
  {path: '/sign-up', name: 'sign-up', component: SignUp, meta: {title: 'sign-up', public: true}},
  {path: '/terms', name: 'terms', component: TermsAndConditions, meta: {title: 'terms', public: true}},
  {
    path: '/',
    component: Layout,
    children: [
      {path: '', name: 'home', redirect: () => homeRouteFor(iamStore.currentUser)},
      {path: 'renter/home', name: 'renter-home', component: RenterHome, meta: {title: 'home', role: UserRole.RENTER}},
      {path: 'renter/search', name: 'vehicle-search', component: VehicleSearch, meta: {title: 'search', role: UserRole.RENTER}},
      {path: 'renter/vehicles/:id', name: 'vehicle-detail', component: VehicleDetail, props: true, meta: {title: 'vehicle-detail', role: UserRole.RENTER, section: 'vehicle-search'}},
      {path: 'renter/vehicles/:id/book', name: 'booking-confirmation', component: BookingConfirmation, props: true, meta: {title: 'booking-confirmation', role: UserRole.RENTER, section: 'vehicle-search'}},
      {path: 'renter/bookings', name: 'renter-bookings', component: RenterBookings, meta: {title: 'my-bookings', role: UserRole.RENTER}},
      {path: 'renter/favorites', name: 'favorite-vehicles', component: FavoriteVehicles, meta: {title: 'favorites', role: UserRole.RENTER}},
      {path: 'owner/home', name: 'owner-home', component: OwnerHome, meta: {title: 'home', role: UserRole.OWNER}},
      {path: 'owner/vehicles', name: 'owner-vehicles', component: OwnerVehicles, meta: {title: 'my-vehicles', role: UserRole.OWNER}},
      {path: 'owner/vehicles/new', name: 'vehicle-create', component: VehicleForm, meta: {title: 'add-vehicle', role: UserRole.OWNER, section: 'owner-vehicles'}},
      {path: 'owner/vehicles/:id', name: 'owner-vehicle-detail', component: OwnerVehicleDetail, props: true, meta: {title: 'vehicle-detail', role: UserRole.OWNER, section: 'owner-vehicles'}},
      {path: 'owner/vehicles/:id/edit', name: 'vehicle-edit', component: VehicleForm, props: true, meta: {title: 'edit-vehicle', role: UserRole.OWNER, section: 'owner-vehicles'}},
      {path: 'owner/bookings', name: 'owner-bookings', component: OwnerBookings, meta: {title: 'owner-bookings', role: UserRole.OWNER}},
      {path: 'owner/availability', name: 'vehicle-availability', component: VehicleAvailability, meta: {title: 'availability', role: UserRole.OWNER}},
      {path: 'owner/transactions', name: 'owner-transactions', component: OwnerTransactions, meta: {title: 'transactions', role: UserRole.OWNER}},
      {path: 'owner/ratings', name: 'owner-ratings', component: OwnerRatings, meta: {title: 'ratings', role: UserRole.OWNER}},
      {path: 'messages', name: 'messages', component: Messages, meta: {title: 'messages'}},
      {path: 'profile', name: 'profile', component: Profile, meta: {title: 'profile'}}
    ]
  },
  {path: '/:pathMatch(.*)*', name: 'not-found', component: PageNotFound, meta: {title: 'not-found', public: true}}
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({top: 0})
});

/**
 * Navigation guard: protects private routes and keeps each role in its own views.
 */
router.beforeEach(to => {
  if (to.meta.public) return true;
  const user = iamStore.currentUser;
  if (!user) return {name: 'sign-in', query: {redirect: to.fullPath}};
  if (to.meta.role && to.meta.role !== user.role) return homeRouteFor(user);
  return true;
});

export default router;
