import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ongera_access_app/modules/root/views/setting_panel.dart';

import '../../home/views/home_view.dart';
import '../../progress/views/progress_view.dart';

class RootController extends GetxController {

  final currentIndex = 0.obs;


  List<Widget> pages = [
    HomeView(),
    ProgressView(),
  ];

  Widget get currentPage => pages[currentIndex.value];

}