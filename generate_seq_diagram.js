const fs = require('fs');

function generateSequenceDiagrams() {
  let xml = `<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1300" pageHeight="3800" background="#ffffff">\n  <root>\n    <mxCell id="0"/>\n    <mxCell id="1" parent="0"/>\n`;

  let cellId = 10;

  // Helper for diagram
  // type: 'login' | 'entry_5' | 'entry_6' | 'verifikasi'
  function addDiagram(cfg) {
    const { title, figNum, figTitle, frameLabel, x, y, width, height, actors } = cfg;

    // Title above
    xml += `    <mxCell id="t_${cellId++}" value="${title}" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontFamily=Times New Roman;fontSize=12;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="${x}" y="${y - 25}" width="${width}" height="20" as="geometry"/></mxCell>\n`;

    // Outer UML Frame
    xml += `    <mxCell id="f_${cellId++}" value="${frameLabel}" style="shape=umlFrame;whiteSpace=wrap;html=1;width=120;height=22;fillColor=none;strokeColor=#000000;strokeWidth=1.2;fontFamily=Times New Roman;fontSize=10;fontStyle=1;align=left;verticalAlign=top;spacingLeft=8;spacingTop=4;" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/></mxCell>\n`;

    // Lifeline positions
    const lifelineCount = actors.length;
    const paddingLeft = 45;
    const usableWidth = width - 90;
    const spacing = usableWidth / (lifelineCount - 1);

    const positions = actors.map((act, i) => {
      const posX = x + paddingLeft + (i * spacing);
      return { ...act, posX };
    });

    const bottomY = y + height - 25;
    const topLifelineY = y + 80;

    // Draw Actor heads & Lifelines
    positions.forEach((p, i) => {
      let headId = `head_${cellId++}`;
      let lineId = `line_${cellId++}`;
      
      if (p.type === 'actor') {
        xml += `    <mxCell id="${headId}" value="${p.label}" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;strokeColor=#000000;fillColor=#ffffff;fontFamily=Times New Roman;fontSize=10.5;strokeWidth=1.2;" vertex="1" parent="1"><mxGeometry x="${p.posX - 12}" y="${y + 22}" width="24" height="42" as="geometry"/></mxCell>\n`;
      } else if (p.type === 'boundary') {
        xml += `    <mxCell id="${headId}" value="${p.label}" style="shape=umlBoundary;whiteSpace=wrap;html=1;verticalLabelPosition=bottom;verticalAlign=top;strokeColor=#000000;fillColor=#fff2cc;strokeWidth=1.2;fontFamily=Times New Roman;fontSize=10;" vertex="1" parent="1"><mxGeometry x="${p.posX - 18}" y="${y + 26}" width="36" height="30" as="geometry"/></mxCell>\n`;
      } else if (p.type === 'control') {
        xml += `    <mxCell id="${headId}" value="${p.label}" style="shape=umlControl;whiteSpace=wrap;html=1;verticalLabelPosition=bottom;verticalAlign=top;strokeColor=#000000;fillColor=#fff2cc;strokeWidth=1.2;fontFamily=Times New Roman;fontSize=10;" vertex="1" parent="1"><mxGeometry x="${p.posX - 15}" y="${y + 26}" width="30" height="30" as="geometry"/></mxCell>\n`;
      } else if (p.type === 'entity') {
        xml += `    <mxCell id="${headId}" value="${p.label}" style="shape=umlEntity;whiteSpace=wrap;html=1;verticalLabelPosition=bottom;verticalAlign=top;strokeColor=#000000;fillColor=#fff2cc;strokeWidth=1.2;fontFamily=Times New Roman;fontSize=10;" vertex="1" parent="1"><mxGeometry x="${p.posX - 15}" y="${y + 26}" width="30" height="30" as="geometry"/></mxCell>\n`;
      }

      // Dashed line
      xml += `    <mxCell id="${lineId}" value="" style="edgeStyle=none;rounded=0;html=1;dashed=1;dashPattern=4 4;endArrow=none;strokeColor=#000000;strokeWidth=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${p.posX}" y="${topLifelineY}" as="sourcePoint"/><mxPoint x="${p.posX}" y="${bottomY}" as="targetPoint"/></mxGeometry></mxCell>\n`;
      p.headId = headId;
      p.lineId = lineId;
    });

    // Draw Activation boxes & Messages
    cfg.messages.forEach((msg) => {
      const fromP = positions[msg.fromIdx];
      const toP = positions[msg.toIdx];
      const msgY = y + msg.yOffset;

      // Activation box at target if specified
      if (msg.hasTargetBox) {
        xml += `    <mxCell id="ab_${cellId++}" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1;" vertex="1" parent="1"><mxGeometry x="${toP.posX - 5}" y="${msgY - 5}" width="10" height="${msg.targetBoxH || 25}" as="geometry"/></mxCell>\n`;
      }

      // Message arrow
      const isReturn = msg.fromIdx > msg.toIdx;
      const startX = fromP.posX + (isReturn ? -5 : 5);
      const endX = toP.posX + (isReturn ? 5 : -5);

      xml += `    <mxCell id="msg_${cellId++}" value="${msg.text}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;endFill=1;strokeColor=#000000;strokeWidth=1;fontSize=9.5;fontFamily=Times New Roman;labelBackgroundColor=#ffffff;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${startX}" y="${msgY}" as="sourcePoint"/><mxPoint x="${endX}" y="${msgY}" as="targetPoint"/></mxGeometry></mxCell>\n`;
    });

    // Caption below
    xml += `    <mxCell id="cap_${cellId++}" value="&lt;i&gt;Gambar 4. ${figNum} ${figTitle}&lt;/i&gt;" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontFamily=Times New Roman;fontSize=11.5;" vertex="1" parent="1"><mxGeometry x="${x}" y="${y + height + 8}" width="${width}" height="20" as="geometry"/></mxCell>\n`;
  }

  // 1. SEQUENCE DIAGRAM LOGIN ADMIN
  addDiagram({
    title: "1. Sequence Diagram Login Admin",
    figNum: 14,
    figTitle: "Sequence Diagram Login Admin",
    frameLabel: "sd Login Admin",
    x: 40,
    y: 50,
    width: 530,
    height: 330,
    actors: [
      { label: ": Admin", type: "actor" },
      { label: ": Form Login", type: "boundary" },
      { label: ": Control Login", type: "control" },
      { label: ": admin", type: "entity" }
    ],
    messages: [
      { fromIdx: 0, toIdx: 1, text: "1: Open()", yOffset: 95, hasTargetBox: true, targetBoxH: 200 },
      { fromIdx: 0, toIdx: 1, text: "2: Input username dan password()", yOffset: 125 },
      { fromIdx: 1, toIdx: 2, text: "2.1: Input username dan password()", yOffset: 140, hasTargetBox: true, targetBoxH: 140 },
      { fromIdx: 0, toIdx: 1, text: "3: Login()", yOffset: 170 },
      { fromIdx: 1, toIdx: 2, text: "3.1: Login()", yOffset: 185 },
      { fromIdx: 2, toIdx: 3, text: "3.1.1: Get id admin dan password()", yOffset: 205, hasTargetBox: true, targetBoxH: 40 },
      { fromIdx: 2, toIdx: 1, text: "3.2: Display()", yOffset: 245 }
    ]
  });

  // 2. SEQUENCE DIAGRAM ENTRY PEGAWAI (5 Lifelines - exact structure of Gambar 4.15 Entry Kategori)
  addDiagram({
    title: "2. Sequence Diagram Entry Pegawai",
    figNum: 15,
    figTitle: "Sequence Diagram Entry Pegawai",
    frameLabel: "sd Entry Pegawai",
    x: 610,
    y: 50,
    width: 610,
    height: 480,
    actors: [
      { label: ": Admin", type: "actor" },
      { label: ": Halaman Beranda", type: "boundary" },
      { label: ": Form Data Pegawai", type: "boundary" },
      { label: ": Control Data Pegawai", type: "control" },
      { label: ": Pegawai", type: "entity" }
    ],
    messages: [
      { fromIdx: 0, toIdx: 1, text: "1: Open()", yOffset: 95, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 1, toIdx: 2, text: "1.1: Open()", yOffset: 115, hasTargetBox: true, targetBoxH: 330 },
      { fromIdx: 0, toIdx: 2, text: "2: Input Data Pegawai()", yOffset: 145 },
      { fromIdx: 2, toIdx: 3, text: "2.1: Input Data Pegawai()", yOffset: 160, hasTargetBox: true, targetBoxH: 270 },
      { fromIdx: 0, toIdx: 2, text: "3: Tambah()", yOffset: 190 },
      { fromIdx: 2, toIdx: 3, text: "3.1: Tambah()", yOffset: 205 },
      { fromIdx: 3, toIdx: 4, text: "3.1.1: Simpan()", yOffset: 220, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 3, toIdx: 2, text: "3.2: Display()", yOffset: 245 },
      { fromIdx: 0, toIdx: 2, text: "4: Edit()", yOffset: 275 },
      { fromIdx: 2, toIdx: 3, text: "4.1: Edit()", yOffset: 290 },
      { fromIdx: 3, toIdx: 4, text: "4.1.1: Edit()", yOffset: 305, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 3, toIdx: 2, text: "4.2: Display()", yOffset: 330 },
      { fromIdx: 0, toIdx: 2, text: "5: Hapus()", yOffset: 360 },
      { fromIdx: 2, toIdx: 3, text: "5.1: Hapus()", yOffset: 375 },
      { fromIdx: 3, toIdx: 4, text: "5.1.1: Hapus()", yOffset: 390, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 3, toIdx: 2, text: "5.2: Display()", yOffset: 415 }
    ]
  });

  // 3. SEQUENCE DIAGRAM ENTRY PENDIDIKAN (6 Lifelines - exact structure of Gambar 4.16 Entry Produk)
  addDiagram({
    title: "3. Sequence Diagram Entry Pendidikan",
    figNum: 16,
    figTitle: "Sequence Diagram Entry Pendidikan",
    frameLabel: "sd Entry Pendidikan",
    x: 40,
    y: 580,
    width: 650,
    height: 490,
    actors: [
      { label: ": Pegawai", type: "actor" },
      { label: ": Halaman Beranda", type: "boundary" },
      { label: ": Form Data Pendidikan", type: "boundary" },
      { label: ": Control Data Pendidikan", type: "control" },
      { label: ": Pegawai", type: "entity" },
      { label: ": Pendidikan", type: "entity" }
    ],
    messages: [
      { fromIdx: 0, toIdx: 1, text: "1: Open()", yOffset: 95, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 1, toIdx: 2, text: "1.1: Open()", yOffset: 115, hasTargetBox: true, targetBoxH: 335 },
      { fromIdx: 0, toIdx: 2, text: "2: Input Data Pendidikan()", yOffset: 145 },
      { fromIdx: 2, toIdx: 3, text: "2.1: Input Data Pendidikan()", yOffset: 160, hasTargetBox: true, targetBoxH: 275 },
      { fromIdx: 3, toIdx: 4, text: "2.1.1: Get Pegawai()", yOffset: 175, hasTargetBox: true, targetBoxH: 25 },
      { fromIdx: 0, toIdx: 2, text: "3: Tambah()", yOffset: 205 },
      { fromIdx: 2, toIdx: 3, text: "3.1: Tambah()", yOffset: 220 },
      { fromIdx: 3, toIdx: 5, text: "3.1.1: Simpan()", yOffset: 235, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 3, toIdx: 2, text: "3.2: Display()", yOffset: 260 },
      { fromIdx: 0, toIdx: 2, text: "4: Edit()", yOffset: 290 },
      { fromIdx: 2, toIdx: 3, text: "4.1: Edit()", yOffset: 305 },
      { fromIdx: 3, toIdx: 5, text: "4.1.1: Edit()", yOffset: 320, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 3, toIdx: 2, text: "4.2: Display()", yOffset: 345 },
      { fromIdx: 0, toIdx: 2, text: "5: Hapus()", yOffset: 375 },
      { fromIdx: 2, toIdx: 3, text: "5.1: Hapus()", yOffset: 390 },
      { fromIdx: 3, toIdx: 5, text: "5.1.1: Hapus()", yOffset: 405, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 3, toIdx: 2, text: "5.2: Display()", yOffset: 430 }
    ]
  });

  // 4. SEQUENCE DIAGRAM ENTRY SERTIFIKASI (6 Lifelines)
  addDiagram({
    title: "4. Sequence Diagram Entry Sertifikasi",
    figNum: 17,
    figTitle: "Sequence Diagram Entry Sertifikasi",
    frameLabel: "sd Entry Sertifikasi",
    x: 40,
    y: 1130,
    width: 650,
    height: 490,
    actors: [
      { label: ": Pegawai", type: "actor" },
      { label: ": Halaman Beranda", type: "boundary" },
      { label: ": Form Data Sertifikasi", type: "boundary" },
      { label: ": Control Data Sertifikasi", type: "control" },
      { label: ": Pegawai", type: "entity" },
      { label: ": Sertifikasi", type: "entity" }
    ],
    messages: [
      { fromIdx: 0, toIdx: 1, text: "1: Open()", yOffset: 95, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 1, toIdx: 2, text: "1.1: Open()", yOffset: 115, hasTargetBox: true, targetBoxH: 335 },
      { fromIdx: 0, toIdx: 2, text: "2: Input Data Sertifikasi()", yOffset: 145 },
      { fromIdx: 2, toIdx: 3, text: "2.1: Input Data Sertifikasi()", yOffset: 160, hasTargetBox: true, targetBoxH: 275 },
      { fromIdx: 3, toIdx: 4, text: "2.1.1: Get Pegawai()", yOffset: 175, hasTargetBox: true, targetBoxH: 25 },
      { fromIdx: 0, toIdx: 2, text: "3: Tambah()", yOffset: 205 },
      { fromIdx: 2, toIdx: 3, text: "3.1: Tambah()", yOffset: 220 },
      { fromIdx: 3, toIdx: 5, text: "3.1.1: Simpan()", yOffset: 235, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 3, toIdx: 2, text: "3.2: Display()", yOffset: 260 },
      { fromIdx: 0, toIdx: 2, text: "4: Edit()", yOffset: 290 },
      { fromIdx: 2, toIdx: 3, text: "4.1: Edit()", yOffset: 305 },
      { fromIdx: 3, toIdx: 5, text: "4.1.1: Edit()", yOffset: 320, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 3, toIdx: 2, text: "4.2: Display()", yOffset: 345 },
      { fromIdx: 0, toIdx: 2, text: "5: Hapus()", yOffset: 375 },
      { fromIdx: 2, toIdx: 3, text: "5.1: Hapus()", yOffset: 390 },
      { fromIdx: 3, toIdx: 5, text: "5.1.1: Hapus()", yOffset: 405, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 3, toIdx: 2, text: "5.2: Display()", yOffset: 430 }
    ]
  });

  // 5. SEQUENCE DIAGRAM ENTRY PENGAJUAN IDP (6 Lifelines)
  addDiagram({
    title: "5. Sequence Diagram Entry IDP",
    figNum: 18,
    figTitle: "Sequence Diagram Entry IDP",
    frameLabel: "sd Entry IDP",
    x: 40,
    y: 1680,
    width: 650,
    height: 490,
    actors: [
      { label: ": Pegawai", type: "actor" },
      { label: ": Halaman Beranda", type: "boundary" },
      { label: ": Form Data IDP", type: "boundary" },
      { label: ": Control Data IDP", type: "control" },
      { label: ": Pegawai", type: "entity" },
      { label: ": IDP", type: "entity" }
    ],
    messages: [
      { fromIdx: 0, toIdx: 1, text: "1: Open()", yOffset: 95, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 1, toIdx: 2, text: "1.1: Open()", yOffset: 115, hasTargetBox: true, targetBoxH: 335 },
      { fromIdx: 0, toIdx: 2, text: "2: Input Data IDP()", yOffset: 145 },
      { fromIdx: 2, toIdx: 3, text: "2.1: Input Data IDP()", yOffset: 160, hasTargetBox: true, targetBoxH: 275 },
      { fromIdx: 3, toIdx: 4, text: "2.1.1: Get Pegawai()", yOffset: 175, hasTargetBox: true, targetBoxH: 25 },
      { fromIdx: 0, toIdx: 2, text: "3: Tambah()", yOffset: 205 },
      { fromIdx: 2, toIdx: 3, text: "3.1: Tambah()", yOffset: 220 },
      { fromIdx: 3, toIdx: 5, text: "3.1.1: Simpan()", yOffset: 235, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 3, toIdx: 2, text: "3.2: Display()", yOffset: 260 },
      { fromIdx: 0, toIdx: 2, text: "4: Edit()", yOffset: 290 },
      { fromIdx: 2, toIdx: 3, text: "4.1: Edit()", yOffset: 305 },
      { fromIdx: 3, toIdx: 5, text: "4.1.1: Edit()", yOffset: 320, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 3, toIdx: 2, text: "4.2: Display()", yOffset: 345 },
      { fromIdx: 0, toIdx: 2, text: "5: Hapus()", yOffset: 375 },
      { fromIdx: 2, toIdx: 3, text: "5.1: Hapus()", yOffset: 390 },
      { fromIdx: 3, toIdx: 5, text: "5.1.1: Hapus()", yOffset: 405, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 3, toIdx: 2, text: "5.2: Display()", yOffset: 430 }
    ]
  });

  // 6. SEQUENCE DIAGRAM VERIFIKASI IDP
  addDiagram({
    title: "6. Sequence Diagram Verifikasi IDP",
    figNum: 19,
    figTitle: "Sequence Diagram Verifikasi IDP",
    frameLabel: "sd Verifikasi IDP",
    x: 40,
    y: 2230,
    width: 610,
    height: 400,
    actors: [
      { label: ": Admin", type: "actor" },
      { label: ": Halaman Beranda", type: "boundary" },
      { label: ": Form Verifikasi IDP", type: "boundary" },
      { label: ": Control Verifikasi IDP", type: "control" },
      { label: ": IDP", type: "entity" }
    ],
    messages: [
      { fromIdx: 0, toIdx: 1, text: "1: Open()", yOffset: 95, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 1, toIdx: 2, text: "1.1: Open()", yOffset: 115, hasTargetBox: true, targetBoxH: 240 },
      { fromIdx: 0, toIdx: 2, text: "2: Pilih IDP & Input Status()", yOffset: 145 },
      { fromIdx: 2, toIdx: 3, text: "2.1: Input Status()", yOffset: 160, hasTargetBox: true, targetBoxH: 180 },
      { fromIdx: 0, toIdx: 2, text: "3: Simpan Verifikasi()", yOffset: 190 },
      { fromIdx: 2, toIdx: 3, text: "3.1: Verifikasi()", yOffset: 205 },
      { fromIdx: 3, toIdx: 4, text: "3.1.1: Simpan()", yOffset: 220, hasTargetBox: true, targetBoxH: 30 },
      { fromIdx: 3, toIdx: 2, text: "3.2: Display()", yOffset: 250 }
    ]
  });

  xml += `  </root>\n</mxGraphModel>`;
  fs.writeFileSync('/Users/mutiaherdiniicloud.com/Downloads/bkd/bkd-app/sequence_diagram.xml', xml, 'utf8');
  console.log("Successfully generated sequence_diagram.xml matching exact skripsi format!");
}

generateSequenceDiagrams();
