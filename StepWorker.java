package uz.diyor.odatlar;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

/** Har 15 daqiqada qadam hisoblagichini o'qib, kunlarga taqsimlaydi. */
public class StepWorker extends Worker {
    public StepWorker(@NonNull Context context, @NonNull WorkerParameters params) { super(context, params); }

    @NonNull @Override
    public Result doWork() {
        StepReader.readAndRecord(getApplicationContext(), 6000);
        OdatWidget.refreshAll(getApplicationContext());
        return Result.success();
    }
}
