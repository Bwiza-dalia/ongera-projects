import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ongera_access_app/modules/widgets/module_app_bar.dart';
import '../controllers/root_controller.dart';

class RootView extends GetView<RootController> {
  const RootView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: ModuleAppBar(title: 'app.title'.tr),
      body: Obx(() {
        return controller.currentPage;
      }),
    );
  }
}
