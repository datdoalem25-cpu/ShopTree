const diaryService = require('../services/diaryService');

exports.addDiary = async (req, res) => {
  try {
    const { productId, activityTitle, description, actionDate } = req.body;
    const farmerId = req.user.id;
    const farmerName = req.user.fullName;

    const safeProductId = String(productId || '').trim();
    const safeActivityTitle = String(activityTitle || '').trim();
    const safeDescription = String(description || '').trim();
    const safeActionDate = String(actionDate || '').trim();
    
    if (!farmerId || !safeProductId || !safeActivityTitle || !safeDescription || !safeActionDate) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }

    const parsedActionDate = new Date(safeActionDate);
    if (Number.isNaN(parsedActionDate.getTime())) {
      return res.status(400).json({ status: 'error', message: 'Ngày thực hiện không hợp lệ.' });
    }

    const eligibleProduct = await diaryService.getEligibleDiaryProduct({
      productId: safeProductId,
      ownerId: farmerId,
      ownerName: farmerName,
    });

    if (!eligibleProduct) {
      return res.status(400).json({
        status: 'error',
        message: 'Chỉ có thể thêm nhật ký cho sản phẩm của bạn đang chờ duyệt hoặc đã phê duyệt.',
      });
    }

    const diary = await diaryService.createDiaryEntry({
      farmerId,
      productId: safeProductId,
      activityTitle: safeActivityTitle,
      cropLabel: eligibleProduct.name,
      description: safeDescription,
      actionDate: parsedActionDate
    });

    res.status(201).json({ status: 'success', data: diary });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getDiaries = async (req, res) => {
  try {
    const farmerId = req.user.id;

    const diaries = await diaryService.getFarmerDiaries(farmerId);
    res.status(200).json({ status: 'success', data: diaries });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
