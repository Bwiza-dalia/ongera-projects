import 'package:get/get.dart';
import 'package:ongera_access_app/modules/root/bindings/root_binding.dart';

import '../modules/atthemarket/bindings/at_the_market_binding.dart';
import '../modules/atthemarket/views/at_the_market_view.dart';
import '../modules/auth/bindings/auth_binding.dart';
import '../modules/auth/bindings/register_binding.dart';
import '../modules/auth/views/login_view.dart';
import '../modules/auth/views/register_view.dart';
import '../modules/auth/views/register_flow_view.dart';
import '../modules/root/views/root_view.dart';
import '../modules/comprehend/bindings/comprehend_binding.dart';
import '../modules/comprehend/views/comprehend_view.dart';
import 'app_routes.dart';

class AppPages {
  static get INITIAL => Routes.LOGIN;

  static final routes = [
    GetPage(
      name: Routes.LOGIN,
      page: () => const LoginView(),
      binding: AuthBinding(),
    ),
    GetPage(
      name: Routes.REGISTER,
      page: () => const RegisterView(),
      binding: AuthBinding(),
    ),
    GetPage(
      name: Routes.REGISTER_FLOW,
      page: () => const RegisterFlowView(),
      binding: RegisterBinding(),
    ),
    GetPage(name: Routes.HOME, page: () => RootView(), binding: RootBinding()),
    GetPage(
      name: Routes.ATTHEMARKET,
      page: () => AtTheMarketView(),
      binding: AtTheMarketBinding(),
    ),
    GetPage(
      name: Routes.COMPREHEND,
      page: () => const ComprehendView(),
      binding: ComprehendBinding(),
    ),
  ];
}
