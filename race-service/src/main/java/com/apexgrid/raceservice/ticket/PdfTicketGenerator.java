package com.apexgrid.raceservice.ticket;

import com.apexgrid.raceservice.booking.entity.Booking;
import com.apexgrid.raceservice.race.entity.Circuit;
import com.apexgrid.raceservice.race.entity.Race;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Component
@Slf4j
public class PdfTicketGenerator {

    // F1 Brand Colors
    private static final DeviceRgb F1_RED = new DeviceRgb(225, 6, 0);
    private static final DeviceRgb F1_DARK = new DeviceRgb(21, 21, 30);
    private static final DeviceRgb F1_GRAY = new DeviceRgb(170, 170, 170);
    private static final DeviceRgb F1_WHITE = new DeviceRgb(255, 255, 255);
    private static final DeviceRgb F1_CARD = new DeviceRgb(30, 30, 46);

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMMM yyyy");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    /**
     * Generate a professional F1-themed PDF ticket
     */
    public byte[] generateTicket(Booking booking, String holderName, byte[] qrCodeImage) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            // A5 Landscape for ticket-like feel
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            PageSize pageSize = new PageSize(595, 420); // A5 landscape
            pdfDoc.setDefaultPageSize(pageSize);
            Document document = new Document(pdfDoc);
            document.setMargins(0, 0, 0, 0);

            // Background
            document.setBackgroundColor(F1_DARK);

            // === RED HEADER BAR ===
            Table header = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
                    .useAllAvailableWidth()
                    .setBackgroundColor(F1_RED)
                    .setPadding(15);

            // Left side: Branding
            Cell brandCell = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .add(new Paragraph("APEXGRID")
                            .setFontSize(28)
                            .setBold()
                            .setFontColor(F1_WHITE)
                            .setMarginBottom(0))
                    .add(new Paragraph("FORMULA 1® OFFICIAL TICKET")
                            .setFontSize(9)
                            .setFontColor(new DeviceRgb(255, 200, 200))
                            .setMarginTop(0));
            header.addCell(brandCell);

            // Right side: Season
            Race race = booking.getRace();
            Cell seasonCell = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE)
                    .add(new Paragraph("SEASON " + (race != null ? race.getSeason() : "2026"))
                            .setFontSize(14)
                            .setBold()
                            .setFontColor(F1_WHITE));
            header.addCell(seasonCell);
            document.add(header);

            // === MAIN CONTENT ===
            Table content = new Table(UnitValue.createPercentArray(new float[]{3, 1.2f}))
                    .useAllAvailableWidth()
                    .setBackgroundColor(F1_CARD)
                    .setPadding(20);

            // Left Column: Event Details
            Cell leftCol = new Cell().setBorder(Border.NO_BORDER).setPaddingRight(15);

            // Race Name
            String raceName = race != null ? race.getName() : "Formula 1 Race";
            leftCol.add(new Paragraph(raceName.toUpperCase())
                    .setFontSize(18)
                    .setBold()
                    .setFontColor(F1_WHITE)
                    .setMarginBottom(8));

            // Circuit info
            Circuit circuit = race != null ? race.getCircuit() : null;
            String circuitName = circuit != null ? circuit.getName() : "N/A";
            String location = circuit != null ? (circuit.getLocation() + ", " + circuit.getCountry()) : "N/A";

            leftCol.add(new Paragraph("📍 " + circuitName)
                    .setFontSize(13)
                    .setFontColor(F1_WHITE)
                    .setMarginBottom(2));
            leftCol.add(new Paragraph(location)
                    .setFontSize(10)
                    .setFontColor(F1_GRAY)
                    .setMarginBottom(12));

            // Info grid
            Table infoGrid = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}))
                    .useAllAvailableWidth();

            addInfoCell(infoGrid, "DATE",
                    race != null && race.getRaceDate() != null ? race.getRaceDate().format(DATE_FORMAT) : "TBD");
            addInfoCell(infoGrid, "TIME",
                    race != null && race.getRaceTime() != null ? race.getRaceTime().format(TIME_FORMAT) + " LOCAL" : "TBD");
            addInfoCell(infoGrid, "ROUND",
                    race != null && race.getRound() != null ? "R" + race.getRound() : "—");

            leftCol.add(infoGrid);

            // Separator line
            leftCol.add(new Paragraph("")
                    .setMarginTop(10)
                    .setMarginBottom(10)
                    .setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(new DeviceRgb(50, 50, 70), 1)));

            // Ticket holder & booking info
            Table holderGrid = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .useAllAvailableWidth();

            addInfoCell(holderGrid, "TICKET HOLDER", holderName != null ? holderName.toUpperCase() : "—");
            addInfoCell(holderGrid, "BOOKING CODE", booking.getBookingCode());
            addInfoCell(holderGrid, "QUANTITY", booking.getQuantity() + " TICKET(S)");
            addInfoCell(holderGrid, "TOTAL PRICE", "$" + booking.getTotalPrice().toPlainString() + " USD");

            leftCol.add(holderGrid);
            content.addCell(leftCol);

            // Right Column: QR Code
            Cell rightCol = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE)
                    .setBackgroundColor(new DeviceRgb(25, 25, 40))
                    .setPadding(10)
                    .setBorderRadius(new com.itextpdf.layout.properties.BorderRadius(8));

            rightCol.add(new Paragraph("SCAN TO ENTER")
                    .setFontSize(8)
                    .setBold()
                    .setFontColor(F1_GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(5));

            if (qrCodeImage != null) {
                Image qrImage = new Image(ImageDataFactory.create(qrCodeImage))
                        .setWidth(130)
                        .setHorizontalAlignment(HorizontalAlignment.CENTER);
                rightCol.add(qrImage);
            }

            rightCol.add(new Paragraph(booking.getBookingCode())
                    .setFontSize(10)
                    .setBold()
                    .setFontColor(F1_RED)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(5));

            rightCol.add(new Paragraph("STATUS: CONFIRMED ✓")
                    .setFontSize(7)
                    .setFontColor(new DeviceRgb(34, 197, 94))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(3));

            content.addCell(rightCol);
            document.add(content);

            // === FOOTER ===
            Table footer = new Table(1).useAllAvailableWidth()
                    .setBackgroundColor(new DeviceRgb(15, 15, 23))
                    .setPadding(8);
            footer.addCell(new Cell().setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.CENTER)
                    .add(new Paragraph("Present this ticket at the circuit gate • Valid for race day only • Non-transferable")
                            .setFontSize(7)
                            .setFontColor(F1_GRAY))
                    .add(new Paragraph("© 2026 ApexGrid — The Ultimate Formula 1 Experience")
                            .setFontSize(7)
                            .setFontColor(new DeviceRgb(80, 80, 100))));
            document.add(footer);

            document.close();
            log.info("PDF ticket generated for booking: {}", booking.getBookingCode());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate PDF ticket for booking {}: {}", booking.getBookingCode(), e.getMessage(), e);
            throw new RuntimeException("Failed to generate PDF ticket", e);
        }
    }

    private void addInfoCell(Table table, String label, String value) {
        Cell cell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(4);
        cell.add(new Paragraph(label)
                .setFontSize(7)
                .setFontColor(F1_GRAY)
                .setMarginBottom(1));
        cell.add(new Paragraph(value)
                .setFontSize(11)
                .setBold()
                .setFontColor(F1_WHITE));
        table.addCell(cell);
    }
}
