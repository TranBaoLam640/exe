import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const policyBlocks = [
  {
    title: 'Chính sách chung',
    sections: [
      {
        title: '1. Gói thuê',
        items: [
          <><strong>Gói thuê 3 ngày:</strong> Ngày thuê, ngày mặc, ngày trả bao gồm 3 ngày 2 đêm.</>,
          <><strong>Gói thuê 24h:</strong> Khách nhận và hoàn trả sản phẩm trong vòng 24h kể từ khi nhận sản phẩm.</>,
          <>Nếu trả muộn hơn lịch đã book, khách vui lòng thông báo với shop, shop xin phép phụ thu thêm <strong>10% giá thuê</strong>.</>,
          <>Khách trả muộn không báo trước làm nỡ lịch thuê nàng sau vui lòng thanh toán <strong>100% giá thuê váy</strong>.</>,
        ],
      },
      {
        title: '2. Đặt lịch sản phẩm',
        items: [
          'Đối với khách đặt lịch giữ mẫu, khách vui lòng đặt cọc trước (giá thuê) để shop giữ lịch.',
          <>Mẫu đã chốt vui lòng không đổi mẫu khác. Shop chỉ hỗ trợ đổi lịch khi khách báo trước tối thiểu <strong>3 ngày</strong>.</>,
        ],
      },
      {
        title: '3. Thanh toán, nhận đồ và bảo quản',
        items: [
          <><strong>Giá thuê:</strong> Thanh toán giá thuê + cọc theo như shop đăng trước khi shop ship váy.</>,
          <><strong>Thời gian thuê:</strong> Bắt đầu khi khách nhận váy — kết thúc từ khi khách gửi "Mã vận đơn" cho shop.</>,
          <><strong>Chất lượng sản phẩm:</strong> Trước khi ship, DoRentMe sẽ quay chụp tình trạng đồ. Sau khi nhận, nàng nhớ check kỹ sản phẩm và thông báo nếu có lỗi.</>,
        ],
        highlight: <><strong>⚠️ Trách nhiệm của khách:</strong> Không tự ý sửa váy, không giặt, bảo quản sản phẩm cẩn thận trong thời gian thuê.</>,
      },
    ],
  },
  {
    title: 'Chính sách về sản phẩm',
    sections: [
      {
        title: 'Vệ sinh & vết bẩn',
        items: [
          <>Nàng <strong>không cần giặt</strong> sau khi sử dụng sản phẩm.</>,
          'Không phụ thu đối với vết dơ giặt đơn giản được như mồ hôi, hơi lem chân váy dài do quét đất.',
          <>Phụ thu <strong>30.000 – 100.000đ</strong> tùy theo giá trị váy, đối với các vết dơ cần dùng chất tẩy rửa.</>,
          'Đối với trường hợp quá nặng, phụ thu tùy theo từng trường hợp.',
        ],
      },
      {
        title: 'Hư hỏng sản phẩm',
        items: [
          <>Khách vui lòng <strong>không tự ý sửa hoặc bóp váy</strong> — DoRentMe sẽ không nhận váy về, khách chịu 100% giá trị váy.</>,
          <>Đối với trường hợp váy bị cháy, rách (không phải do bung chỉ), khách vui lòng chịu <strong>100% giá trị váy</strong>.</>,
        ],
        highlight: <><strong>💡 Lưu ý:</strong> Mọi tình trạng sản phẩm sẽ được DoRentMe quay chụp trước khi giao. Nàng hãy kiểm tra kỹ khi nhận hàng và phản hồi ngay nếu phát hiện lỗi.</>,
      },
    ],
  },
];

const terms = [
  {
    title: 'Chấp thuận điều khoản',
    content: [
      'Khi truy cập và sử dụng website DoRentMe, bạn đồng ý bị ràng buộc bởi các điều khoản và điều kiện này. Nếu bạn không đồng ý với bất kỳ phần nào, vui lòng không sử dụng dịch vụ của chúng tôi.',
      'DoRentMe có quyền cập nhật điều khoản bất kỳ lúc nào. Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp thuận điều khoản mới.',
    ],
  },
  {
    title: 'Điều kiện sử dụng',
    items: [
      <>Người dùng phải từ <strong>16 tuổi</strong> trở lên để đặt thuê trang phục.</>,
      'Thông tin cung cấp khi đặt hàng phải chính xác và trung thực.',
      'Mỗi tài khoản chỉ được sử dụng bởi một cá nhân, không được chia sẻ.',
      'Nghiêm cấm sử dụng dịch vụ cho mục đích thương mại khi chưa có sự cho phép của DoRentMe.',
    ],
  },
  {
    title: 'Tài khoản & bảo mật',
    content: [
      'Bạn có trách nhiệm bảo mật thông tin đăng nhập của mình. DoRentMe sẽ không chịu trách nhiệm cho bất kỳ tổn thất nào phát sinh do việc bạn để lộ thông tin tài khoản.',
      <>Nếu phát hiện tài khoản bị truy cập trái phép, vui lòng thông báo ngay cho chúng tôi qua trang <a href="/contact" style={{ color: '#1a6640', fontWeight: 600 }}>Liên hệ</a>.</>,
    ],
  },
  {
    title: 'Quyền & nghĩa vụ của khách hàng',
    items: [
      'Thanh toán đầy đủ và đúng hạn theo thỏa thuận khi đặt thuê.',
      'Bảo quản trang phục cẩn thận trong suốt thời gian thuê.',
      'Hoàn trả sản phẩm đúng hạn và đúng tình trạng ban đầu.',
      'Thông báo kịp thời nếu muốn thay đổi lịch hoặc gặp sự cố.',
    ],
  },
  {
    title: 'Quyền & nghĩa vụ của DoRentMe',
    items: [
      'Cung cấp trang phục đúng mô tả, đảm bảo vệ sinh và chất lượng trước khi giao.',
      'Quay chụp tình trạng sản phẩm trước khi ship để làm căn cứ đối chiếu.',
      'Hỗ trợ khách hàng trong giờ làm việc và xử lý khiếu nại trong vòng 24h.',
      'Bảo mật thông tin cá nhân của khách hàng, không chia sẻ cho bên thứ ba khi chưa được đồng ý.',
    ],
  },
  {
    title: 'Bảo mật thông tin cá nhân',
    content: [
      'DoRentMe thu thập một số thông tin cơ bản (tên, số điện thoại, địa chỉ giao hàng) nhằm mục đích xử lý đơn thuê và cải thiện trải nghiệm dịch vụ.',
    ],
    items: [
      <>Thông tin của bạn <strong>không được bán</strong> hoặc chia sẻ với bên thứ ba vì mục đích thương mại.</>,
      'Chúng tôi có thể gửi thông báo về đơn hàng hoặc ưu đãi qua email/SMS bạn đã đăng ký.',
      'Bạn có thể yêu cầu xóa dữ liệu cá nhân bất kỳ lúc nào bằng cách liên hệ với chúng tôi.',
    ],
  },
  {
    title: 'Giới hạn trách nhiệm',
    content: [
      'DoRentMe không chịu trách nhiệm cho các trường hợp ngoài tầm kiểm soát như: thiên tai, sự cố vận chuyển từ đơn vị thứ ba, hoặc các tình huống bất khả kháng khác.',
    ],
    highlight: '💡 Trong trường hợp sản phẩm bị thất lạc do lỗi vận chuyển, DoRentMe sẽ hoàn tiền cọc và phối hợp cùng đơn vị vận chuyển để giải quyết.',
  },
  {
    title: 'Giải quyết tranh chấp',
    content: [
      'Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết thông qua thương lượng và hòa giải giữa hai bên.',
      <>Trong trường hợp không đạt được thỏa thuận, tranh chấp sẽ được giải quyết theo quy định của <strong>pháp luật Việt Nam</strong> tại cơ quan có thẩm quyền.</>,
    ],
  },
];

function PageTitle({ title, children }) {
  return (
    <div className="page-title">
      <h1>{title}</h1>
      <p>{children}</p>
      <div className="divider" />
    </div>
  );
}

export function PolicyPage() {
  useDocumentTitle('Chính Sách | DoRentMe');

  return (
    <div className="legal-page policy-page">
      <div className="page-wrapper">
        <div className="page-inner">
          <PageTitle title="Chính Sách">Các quy định và điều khoản thuê trang phục tại DoRentMe</PageTitle>
          {policyBlocks.map((block) => (
            <div className="policy-block" key={block.title}>
              <h2>{block.title}</h2>
              {block.sections.map((section) => (
                <div className="policy-section" key={section.title}>
                  <h3>{section.title}</h3>
                  <ul>
                    {section.items.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                  {section.highlight ? <div className="highlight-box">{section.highlight}</div> : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TermsPage() {
  useDocumentTitle('Điều Khoản Sử Dụng | DoRentMe');

  return (
    <div className="legal-page terms-page">
      <div className="page-wrapper">
        <div className="page-inner">
          <PageTitle title="Điều Khoản Sử Dụng">Vui lòng đọc kỹ trước khi sử dụng dịch vụ của DoRentMe</PageTitle>
          <p className="updated">Cập nhật lần cuối: tháng 6, 2026</p>
          {terms.map((term, index) => (
            <div className="term-block" key={term.title}>
              <h2><span className="num">{index + 1}</span> {term.title}</h2>
              {term.content?.map((item, itemIndex) => <p key={itemIndex}>{item}</p>)}
              {term.items ? (
                <ul>
                  {term.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                </ul>
              ) : null}
              {term.highlight ? <div className="highlight-box">{term.highlight}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
